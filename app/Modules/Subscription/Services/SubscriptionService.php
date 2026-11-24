<?php

namespace App\Modules\Subscription\Services;

use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Invoice\Models\InvoiceModel;
use App\Modules\Subscription\DTOs\SubscriptionActionResponseData;
use App\Modules\Subscription\DTOs\SubscriptionResponseData;
use App\Modules\Subscription\Interfaces\SubscriptionServiceInterface;
use App\Modules\Subscription\Models\SubscriptionModel;
use App\Modules\Subscription\RepositoryInterfaces\SubscriptionRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SubscriptionService implements SubscriptionServiceInterface
{
    public function __construct(
        private readonly SubscriptionRepositoryInterface $repository,
    ) {}

    public function listAll(array $filters = []): SubscriptionActionResponseData
    {
        try {
            $subs = $this->repository->all($filters);

            $items = $subs
                ->map(fn (SubscriptionModel $s) => SubscriptionResponseData::fromModel($s)->toArray())
                ->values()
                ->all();

            return SubscriptionActionResponseData::success(
                message: 'Subscriptions fetched successfully.',
                subscription: null,
                payload: ['items' => $items, 'total' => count($items)],
            );
        } catch (\Throwable $e) {
            Log::error('Subscription list failed', ['error' => $e->getMessage()]);
            return SubscriptionActionResponseData::error('Failed to fetch subscriptions.');
        }
    }

    public function show(string $id): SubscriptionActionResponseData
    {
        $sub = $this->repository->findById($id);
        if (! $sub) {
            return SubscriptionActionResponseData::error('Subscription not found.');
        }

        return SubscriptionActionResponseData::success(
            message: 'Subscription fetched successfully.',
            subscription: SubscriptionResponseData::fromModel($sub),
        );
    }

    public function showForApplicant(string $applicantId): SubscriptionActionResponseData
    {
        $sub = $this->repository->findActiveByApplicant($applicantId);
        if (! $sub) {
            return SubscriptionActionResponseData::error('No active subscription found.');
        }

        return SubscriptionActionResponseData::success(
            message: 'Subscription fetched successfully.',
            subscription: SubscriptionResponseData::fromModel($sub),
        );
    }

    /**
     * Record a subscription from a confirmed payment.
     *
     * Rules (per spec):
     *  - payment_confirmed_at = payment.created_at
     *  - starts_at            = invoice.start_date
     *  - ends_at              = invoice.end_date
     *  - Any prior active subscription for the applicant is closed (renewal).
     */
    public function recordFromPayment(string $applicantId, string $invoiceId, string $paymentId): SubscriptionActionResponseData
    {
        try {
            $invoice = InvoiceModel::find($invoiceId);
            if (! $invoice) {
                return SubscriptionActionResponseData::error('Invoice not found for subscription.');
            }

            $payment = \App\Modules\Payment\Models\PaymentModel::find($paymentId);
            if (! $payment) {
                return SubscriptionActionResponseData::error('Payment not found for subscription.');
            }

            if (! $invoice->start_date || ! $invoice->end_date) {
                return SubscriptionActionResponseData::error(
                    'Invoice is missing start_date/end_date; cannot create subscription.'
                );
            }

            $sub = DB::transaction(function () use ($applicantId, $invoiceId, $paymentId, $invoice, $payment) {
                // Close any currently-active subscription (renewal replaces it)
                SubscriptionModel::where('applicant_id', $applicantId)
                    ->where('status', 'active')
                    ->update(['status' => 'expired']);

                return $this->repository->create([
                    'applicant_id'         => $applicantId,
                    'invoice_id'           => $invoiceId,
                    'payment_id'           => $paymentId,
                    'payment_confirmed_at' => $payment->created_at ?? now(),
                    'starts_at'            => $invoice->start_date->startOfDay(),
                    'ends_at'              => $invoice->end_date->endOfDay(),
                    'status'               => 'active',
                ]);
            });

            Log::info('Subscription recorded', [
                'subscription_id' => $sub->id,
                'applicant_id'    => $applicantId,
                'invoice_id'      => $invoiceId,
                'payment_id'      => $paymentId,
                'starts_at'       => $sub->starts_at,
                'ends_at'         => $sub->ends_at,
            ]);

            return SubscriptionActionResponseData::success(
                message: 'Subscription recorded successfully.',
                subscription: SubscriptionResponseData::fromModel($sub),
            );
        } catch (\Throwable $e) {
            Log::error('Subscription record failed', [
                'applicant_id' => $applicantId,
                'invoice_id'   => $invoiceId,
                'payment_id'   => $paymentId,
                'error'        => $e->getMessage(),
            ]);
            return SubscriptionActionResponseData::error('Failed to record subscription: ' . $e->getMessage());
        }
    }

    public function cancel(SubscriptionModel $subscription): SubscriptionActionResponseData
    {
        try {
            $updated = $this->repository->update($subscription, ['status' => 'cancelled']);

            return SubscriptionActionResponseData::success(
                message: 'Subscription cancelled successfully.',
                subscription: SubscriptionResponseData::fromModel($updated),
            );
        } catch (\Throwable $e) {
            Log::error('Subscription cancel failed', [
                'subscription_id' => $subscription->id,
                'error'           => $e->getMessage(),
            ]);
            return SubscriptionActionResponseData::error('Failed to cancel subscription.');
        }
    }
}
