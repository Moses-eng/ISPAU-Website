<?php

namespace App\Modules\Payment\Services;

use App\Helpers\AdminNotificationHelper;
use App\Helpers\ApplicantNotificationHelper;
use App\Helpers\MembershipAdminNotificationHelper;
use App\Helpers\OperationsOfficerAdminNotificationHelper;
use App\Mail\PaymentReceivedMail;
use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Payment\DTOs\PaymentActionResponseData;
use App\Modules\Payment\DTOs\PaymentRequestData;
use App\Modules\Payment\DTOs\PaymentResponseData;
use App\Modules\Payment\Interfaces\PaymentServiceInterface;
use App\Modules\Payment\Models\PaymentModel;
use App\Modules\Payment\RepositoryInterfaces\PaymentRepositoryInterface;
use App\Modules\Subscription\Interfaces\SubscriptionServiceInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PaymentService implements PaymentServiceInterface
{
    public function __construct(
        private readonly PaymentRepositoryInterface $repository,
        private readonly PaymentNumberGenerator     $numbers,
    ) {}

    // ==================== LIST ====================

    public function listAll(array $filters = []): PaymentActionResponseData
    {
        try {
            $payments = $this->repository->all($filters);

            $items = $payments
                ->map(fn (PaymentModel $p) => PaymentResponseData::fromModel($p)->toArray())
                ->values()
                ->all();

            return PaymentActionResponseData::success(
                message: 'Payments fetched successfully.',
                payment: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Payment list failed', [
                'error'   => $e->getMessage(),
                'filters' => $filters,
            ]);
            return PaymentActionResponseData::error('Failed to fetch payments.');
        }
    }

    // ==================== SHOW ====================

    public function show(string $id): PaymentActionResponseData
    {
        $payment = $this->repository->findById($id);
        if (! $payment) {
            return PaymentActionResponseData::error('Payment not found.');
        }

        return PaymentActionResponseData::success(
            message: 'Payment fetched successfully.',
            payment: PaymentResponseData::fromModel($payment),
        );
    }

    // ==================== CREATE ====================

    public function create(PaymentRequestData $data): PaymentActionResponseData
    {
        try {
            $createdPayment = DB::transaction(function () use ($data) {
                $attributes = $data->toArray();
                $attributes['status'] = $attributes['status'] ?? 'active';

                // 🔒 Auto-generate the payment number (delete-safe sequence)
                $attributes['payment_no'] = $this->numbers->next();

                return $this->repository->create($attributes);
            });

            $applicantId   = $createdPayment->applicant_id;
            $applicantName = ApplicationModel::getApplicateName($applicantId) ?? 'Applicant';
            $applicantMail = ApplicationModel::getApplicateEmail($applicantId);

            // 1. Update Application status to "Active" and dispatch status notifications
            if ($applicantId) {
                $application = ApplicationModel::find($applicantId);
                if ($application) {
                    $application->update(['status' => 'Active']);
                    $freshApp = $application->fresh();

                    // Notify applicant and all 3 admins about the status change to Active
                    ApplicantNotificationHelper::notifyStatusUpdated($freshApp, 'Active');
                    AdminNotificationHelper::notifyStatusUpdated($freshApp, 'Active');
                    OperationsOfficerAdminNotificationHelper::notifyStatusUpdated($freshApp, 'Active');
                    MembershipAdminNotificationHelper::notifyStatusUpdated($freshApp, 'Active');
                }
            }

            // 2. In-portal applicant notification for payment receipt
            if ($applicantId) {
                ApplicantNotificationHelper::notifyPaymentCreated($createdPayment, $applicantName);
            }

            // 3. Send confirmation email with 'Active' status
            $this->sendPaymentReceivedEmail(
                payment: $createdPayment,
                recipientEmail: $applicantMail,
                recipientName: $applicantName,
                status: 'Active'
            );

            Log::info('Payment created & application activated', [
                'payment_id'     => $createdPayment->payment_id ?? $createdPayment->id,
                'payment_no'     => $createdPayment->payment_no,
                'applicant_id'   => $applicantId,
                'updated_status' => 'Active',
                'recipient'      => $applicantMail,
            ]);

            // 4. Record subscription for this payment
            if ($createdPayment->invoice_id && $createdPayment->applicant_id) {
                try {
                    app(SubscriptionServiceInterface::class)
                        ->recordFromPayment(
                            applicantId: $createdPayment->applicant_id,
                            invoiceId:   $createdPayment->invoice_id,
                            paymentId:   $createdPayment->payment_id,
                        );
                } catch (\Throwable $e) {
                    Log::error('Subscription recording failed after payment', [
                        'payment_id'   => $createdPayment->payment_id,
                        'applicant_id' => $createdPayment->applicant_id,
                        'invoice_id'   => $createdPayment->invoice_id,
                        'error'        => $e->getMessage(),
                    ]);
                }
            }

            return PaymentActionResponseData::success(
                message: "Payment {$createdPayment->payment_no} created successfully. Application is now Active.",
                payment: PaymentResponseData::fromModel($createdPayment),
            );
        } catch (\Throwable $e) {
            Log::error('Payment creation failed', ['error' => $e->getMessage()]);
            return PaymentActionResponseData::error(
                'Creation failed: ' . $e->getMessage()
            );
        }
    }

    // ==================== UPDATE ====================

    public function update(PaymentModel $payment, PaymentRequestData $data): PaymentActionResponseData
    {
        try {
            $attributes = $data->toArray();

            // 🔒 Never let payment_no be overwritten on update
            unset($attributes['payment_no']);

            $updated = $this->repository->update($payment, $attributes);

            return PaymentActionResponseData::success(
                message: 'Payment updated successfully.',
                payment: PaymentResponseData::fromModel($updated),
            );
        } catch (\Throwable $e) {
            Log::error('Payment update failed', [
                'payment_id' => $payment->payment_id ?? $payment->id,
                'error'      => $e->getMessage(),
            ]);
            return PaymentActionResponseData::error('Failed to update payment.');
        }
    }

    // ==================== DELETE ====================

    public function delete(PaymentModel $payment): PaymentActionResponseData
    {
        try {
            $this->repository->delete($payment);

            Log::info('Payment deleted', [
                'payment_id' => $payment->payment_id ?? $payment->id,
                'reference'  => $payment->payment_reference,
            ]);

            return PaymentActionResponseData::success(
                message: 'Payment deleted successfully.',
                payment: null,
            );
        } catch (\Throwable $e) {
            Log::error('Payment delete failed', [
                'payment_id' => $payment->payment_id ?? $payment->id,
                'error'      => $e->getMessage(),
            ]);
            return PaymentActionResponseData::error('Failed to delete payment.');
        }
    }

    // ==================== EMAIL HELPER ====================

    private function sendPaymentReceivedEmail(
        PaymentModel $payment,
        ?string $recipientEmail,
        string $recipientName,
        string $status = 'Active'
    ): void {
        if (empty($recipientEmail)) {
            Log::warning('Payment email skipped: No recipient email found for applicant.', [
                'payment_id'   => $payment->payment_id ?? $payment->id,
                'applicant_id' => $payment->applicant_id,
            ]);
            return;
        }

        try {
            Mail::to($recipientEmail)->send(
                new PaymentReceivedMail(
                    payment: $payment,
                    applicantName: $recipientName,
                    status: $status
                )
            );
        } catch (\Throwable $e) {
            Log::error('Failed to dispatch payment confirmation email', [
                'payment_id' => $payment->payment_id ?? $payment->id,
                'recipient'  => $recipientEmail,
                'error'      => $e->getMessage(),
            ]);
        }
    }
}
