<?php

namespace App\Modules\Invoice\Services;

use App\Helpers\ApplicantNotificationHelper;
use App\Mail\InvoiceCreatedMail;
use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Invoice\DTOs\InvoiceActionResponseData;
use App\Modules\Invoice\DTOs\InvoiceRequestData;
use App\Modules\Invoice\DTOs\InvoiceResponseData;
use App\Modules\Invoice\Interfaces\InvoiceServiceInterface;
use App\Modules\Invoice\Models\InvoiceModel;
use App\Modules\Invoice\RepositoryInterfaces\InvoiceRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class InvoiceService implements InvoiceServiceInterface
{
    public function __construct(
        private readonly InvoiceRepositoryInterface $repository,
        private readonly InvoiceAttachmentService   $attachments,
        private readonly InvoiceNumberGenerator     $numbers,
    ) {}

    // ==================== LIST ====================

    public function listAll(array $filters = []): InvoiceActionResponseData
    {
        try {
            $invoices = $this->repository->all($filters);

            $items = $invoices
                ->map(fn (InvoiceModel $i) => InvoiceResponseData::fromModel($i)->toArray())
                ->values()
                ->all();

            return InvoiceActionResponseData::success(
                message: 'Invoices fetched successfully.',
                invoice: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Invoice list failed', [
                'error'   => $e->getMessage(),
                'filters' => $filters,
            ]);
            return InvoiceActionResponseData::error('Failed to fetch invoices.');
        }
    }

    // ==================== SHOW ====================

    public function show(string $id): InvoiceActionResponseData
    {
        $invoice = $this->repository->findById($id);
        if (! $invoice) {
            return InvoiceActionResponseData::error('Invoice not found.');
        }

        return InvoiceActionResponseData::success(
            message: 'Invoice fetched successfully.',
            invoice: InvoiceResponseData::fromModel($invoice),
        );
    }

    // ==================== CREATE ====================

    public function create(InvoiceRequestData $data): InvoiceActionResponseData
    {
        try {
            $createdInvoice = DB::transaction(function () use ($data) {
                $attributes = $data->toArray();

                // Defaults
                $attributes['status']         = $attributes['status']         ?? 'active';
                $attributes['payment_status'] = $attributes['payment_status'] ?? 'Pending';

                // Auto-generate delete-safe invoice number
                $attributes['invoice_number'] = $this->numbers->next();

                $invoice = $this->repository->create($attributes);

                if ($data->invoice_pdf) {
                    $path = $this->attachments->storePdf($invoice->id, $data->invoice_pdf);
                    if ($path) {
                        $invoice = $this->repository->update($invoice, ['invoice_pdf' => $path]);
                    }
                }

                return $invoice;
            });

            // 1. Fetch recipient name and email using ApplicationModel helper methods
            $applicantId   = $createdInvoice->applicant_id;
            $applicantName = ApplicationModel::getApplicateName($applicantId) ?? 'Applicant';
            $applicantMail = ApplicationModel::getApplicateEmail($applicantId);

            // 2. Create in-portal applicant notification
            if ($applicantId) {
                ApplicantNotificationHelper::notifyInvoiceCreated($createdInvoice, $applicantName);
            }

            // 3. Send professional email
            $this->sendInvoiceCreatedEmail($createdInvoice, $applicantMail, $applicantName);

            Log::info('Invoice created & notifications dispatched', [
                'invoice_id'     => $createdInvoice->id,
                'invoice_number' => $createdInvoice->invoice_number,
                'start_date'     => optional($createdInvoice->start_date)->toDateString(),
                'end_date'       => optional($createdInvoice->end_date)->toDateString(),
                'recipient'      => $applicantMail,
            ]);

            return InvoiceActionResponseData::success(
                message: "Invoice {$createdInvoice->invoice_number} created successfully.",
                invoice: InvoiceResponseData::fromModel($createdInvoice),
            );
        } catch (\Throwable $e) {
            Log::error('Invoice creation failed', ['error' => $e->getMessage()]);
            return InvoiceActionResponseData::error(
                'Creation failed: ' . $e->getMessage()
            );
        }
    }

    // ==================== UPDATE ====================

    public function update(InvoiceModel $invoice, InvoiceRequestData $data): InvoiceActionResponseData
    {
        try {
            return DB::transaction(function () use ($invoice, $data) {
                $attributes = $data->toArray();

                // Never let invoice_number be overwritten on update
                unset($attributes['invoice_number']);

                $updated = $this->repository->update($invoice, $attributes);

                if ($data->invoice_pdf) {
                    $path = $this->attachments->storePdf($updated->id, $data->invoice_pdf);
                    if ($path) {
                        $updated = $this->repository->update($updated, ['invoice_pdf' => $path]);
                    }
                }

                return InvoiceActionResponseData::success(
                    message: 'Invoice updated successfully.',
                    invoice: InvoiceResponseData::fromModel($updated),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Invoice update failed', [
                'invoice_id' => $invoice->id,
                'error'      => $e->getMessage(),
            ]);
            return InvoiceActionResponseData::error('Failed to update invoice.');
        }
    }

    // ==================== DELETE ====================

    public function delete(InvoiceModel $invoice): InvoiceActionResponseData
    {
        try {
            $this->attachments->deletePdf($invoice->id);
            $this->repository->delete($invoice);

            Log::info('Invoice deleted', [
                'invoice_id'     => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
            ]);

            return InvoiceActionResponseData::success(
                message: 'Invoice deleted successfully.',
                invoice: null,
            );
        } catch (\Throwable $e) {
            Log::error('Invoice delete failed', [
                'invoice_id' => $invoice->id,
                'error'      => $e->getMessage(),
            ]);
            return InvoiceActionResponseData::error('Failed to delete invoice.');
        }
    }

    // ==================== EMAIL HELPER ====================

    private function sendInvoiceCreatedEmail(InvoiceModel $invoice, ?string $recipientEmail, string $recipientName): void
    {
        if (empty($recipientEmail)) {
            Log::warning('Invoice email skipped: No recipient email found for applicant.', [
                'invoice_id'   => $invoice->id,
                'applicant_id' => $invoice->applicant_id,
            ]);
            return;
        }

        try {
            Mail::to($recipientEmail)->send(
                new InvoiceCreatedMail($invoice, $recipientName)
            );
        } catch (\Throwable $e) {
            Log::error('Failed to dispatch invoice email', [
                'invoice_id' => $invoice->id,
                'recipient'  => $recipientEmail,
                'error'      => $e->getMessage(),
            ]);
        }
    }
}
