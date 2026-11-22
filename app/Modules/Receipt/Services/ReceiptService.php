<?php

namespace App\Modules\Receipt\Services;

use App\Helpers\FinanceAdminNotificationHelper;
use App\Mail\ReceiptUploadedFinanceMail;
use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Invoice\Models\InvoiceModel;
use App\Modules\Receipt\DTOs\ReceiptActionResponseData;
use App\Modules\Receipt\DTOs\ReceiptRequestData;
use App\Modules\Receipt\DTOs\ReceiptResponseData;
use App\Modules\Receipt\Interfaces\ReceiptServiceInterface;
use App\Modules\Receipt\Models\ReceiptModel;
use App\Modules\Receipt\RepositoryInterfaces\ReceiptRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ReceiptService implements ReceiptServiceInterface
{
    public function __construct(
        private readonly ReceiptRepositoryInterface $repository,
        private readonly ReceiptAttachmentService   $attachments,
    ) {}

    // ==================== LIST ====================

    public function listAll(array $filters = []): ReceiptActionResponseData
    {
        try {
            $receipts = $this->repository->all($filters);

            $items = $receipts
                ->map(fn (ReceiptModel $r) => ReceiptResponseData::fromModel($r)->toArray())
                ->values()
                ->all();

            return ReceiptActionResponseData::success(
                message: 'Receipts fetched successfully.',
                receipt: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Receipt list failed', [
                'error'   => $e->getMessage(),
                'filters' => $filters,
            ]);
            return ReceiptActionResponseData::error('Failed to fetch receipts.');
        }
    }

    // ==================== SHOW ====================

    public function show(string $id): ReceiptActionResponseData
    {
        $receipt = $this->repository->findById($id);
        if (! $receipt) {
            return ReceiptActionResponseData::error('Receipt not found.');
        }

        return ReceiptActionResponseData::success(
            message: 'Receipt fetched successfully.',
            receipt: ReceiptResponseData::fromModel($receipt),
        );
    }

    // ==================== CREATE ====================

    public function create(ReceiptRequestData $data): ReceiptActionResponseData
    {
        try {
            return DB::transaction(function () use ($data) {
                $receipt = $this->repository->create($data->toArray());

                if ($data->receipt_pdf) {
                    $path = $this->attachments->storePdf($receipt->receipt_id, $data->receipt_pdf);
                    if ($path) {
                        $receipt = $this->repository->update($receipt, ['receipt_pdf' => $path]);
                    }
                }

                Log::info('Receipt created', ['receipt_id' => $receipt->receipt_id]);

                return ReceiptActionResponseData::success(
                    message: 'Receipt created successfully.',
                    receipt: ReceiptResponseData::fromModel($receipt),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Receipt creation failed', ['error' => $e->getMessage()]);
            return ReceiptActionResponseData::error('Creation failed: ' . $e->getMessage());
        }
    }

    // ==================== UPDATE ====================

    public function update(ReceiptModel $receipt, ReceiptRequestData $data): ReceiptActionResponseData
    {
        try {
            return DB::transaction(function () use ($receipt, $data) {
                $updated = $this->repository->update($receipt, $data->toArray());

                if ($data->receipt_pdf) {
                    $path = $this->attachments->storePdf($updated->receipt_id, $data->receipt_pdf);
                    if ($path) {
                        $updated = $this->repository->update($updated, ['receipt_pdf' => $path]);
                    }
                }

                return ReceiptActionResponseData::success(
                    message: 'Receipt updated successfully.',
                    receipt: ReceiptResponseData::fromModel($updated),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Receipt update failed', [
                'receipt_id' => $receipt->receipt_id,
                'error'      => $e->getMessage(),
            ]);
            return ReceiptActionResponseData::error('Failed to update receipt.');
        }
    }

    // ==================== DELETE ====================

    public function delete(ReceiptModel $receipt): ReceiptActionResponseData
    {
        try {
            $this->attachments->deletePdf($receipt->receipt_id);
            $this->repository->delete($receipt);

            Log::info('Receipt deleted', ['receipt_id' => $receipt->receipt_id]);

            return ReceiptActionResponseData::success(
                message: 'Receipt deleted successfully.',
                receipt: null,
            );
        } catch (\Throwable $e) {
            Log::error('Receipt delete failed', [
                'receipt_id' => $receipt->receipt_id,
                'error'      => $e->getMessage(),
            ]);
            return ReceiptActionResponseData::error('Failed to delete receipt.');
        }
    }

    // ==================== APPLICANT UPLOAD ====================

    public function uploadReceipt(string $invoiceId, string $applicantId, ReceiptRequestData $data): ReceiptActionResponseData
    {
        if (! $data->receipt_pdf) {
            return ReceiptActionResponseData::error('Receipt PDF is required.');
        }

        try {
            $receipt = DB::transaction(function () use ($invoiceId, $applicantId, $data) {
                $existing = $this->repository->findByInvoiceAndApplicant($invoiceId, $applicantId);

                if ($existing) {
                    $path = $this->attachments->storePdf($existing->receipt_id, $data->receipt_pdf);
                    return $path
                        ? $this->repository->update($existing, ['receipt_pdf' => $path])
                        : $existing;
                }

                $newReceipt = $this->repository->create([
                    'invoice_id'   => $invoiceId,
                    'applicant_id' => $applicantId,
                ]);

                $path = $this->attachments->storePdf($newReceipt->receipt_id, $data->receipt_pdf);
                if ($path) {
                    $newReceipt = $this->repository->update($newReceipt, ['receipt_pdf' => $path]);
                }

                return $newReceipt;
            });

            // 1. Retrieve applicant and invoice details via models
            $applicantName  = ApplicationModel::getApplicateName($applicantId) ?? 'Applicant';
            $applicantEmail = ApplicationModel::getApplicateEmail($applicantId);
            $invoiceNumber  = InvoiceModel::getInvoiceNumber($invoiceId) ?? $invoiceId;

            // 2. Create internal Finance Admin notification
            FinanceAdminNotificationHelper::reciptUploaded(
                applicantId: $applicantId,
                invoiceNumber: $invoiceNumber,
                applicantName: $applicantName,
                applicantEmail: $applicantEmail
            );

            // 3. Dispatch professional alert email to the finance team
            $this->sendFinanceAlertEmail($invoiceNumber, $applicantName, $applicantEmail);

            Log::info('Receipt uploaded, finance notification and email sent', [
                'receipt_id'     => $receipt->receipt_id,
                'invoice_number' => $invoiceNumber,
                'applicant_id'   => $applicantId,
            ]);

            return ReceiptActionResponseData::success(
                message: 'Receipt uploaded successfully.',
                receipt: ReceiptResponseData::fromModel($receipt),
            );
        } catch (\Throwable $e) {
            Log::error('Receipt upload failed', [
                'invoice_id'   => $invoiceId,
                'applicant_id' => $applicantId,
                'error'        => $e->getMessage(),
            ]);
            return ReceiptActionResponseData::error('Upload failed: ' . $e->getMessage());
        }
    }

    // ==================== INTERNAL EMAIL DISPATCH ====================

    private function sendFinanceAlertEmail(string $invoiceNumber, string $applicantName, ?string $applicantEmail): void
    {
            Log::warning($invoiceNumber. $applicantName . $applicantEmail);

        $financeEmail = env('FINANCE_NOTIFICATION_EMAIL');

        if (empty($financeEmail)) {
            Log::warning('Finance receipt email skipped: FINANCE_NOTIFICATION_EMAIL not configured.');
            return;
        }

        try {
            Mail::to($financeEmail)->send(
                new ReceiptUploadedFinanceMail($invoiceNumber, $applicantName, $applicantEmail)
            );
        } catch (\Throwable $e) {
            Log::error('Failed to dispatch receipt upload email to finance', [
                'invoice_number' => $invoiceNumber,
                'error'          => $e->getMessage(),
            ]);
        }
    }
}
