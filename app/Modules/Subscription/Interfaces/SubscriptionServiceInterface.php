<?php

namespace App\Modules\Subscription\Interfaces;

use App\Modules\Subscription\DTOs\SubscriptionActionResponseData;
use App\Modules\Subscription\Models\SubscriptionModel;

interface SubscriptionServiceInterface
{
    public function listAll(array $filters = []): SubscriptionActionResponseData;
    public function show(string $id): SubscriptionActionResponseData;
    public function showForApplicant(string $applicantId): SubscriptionActionResponseData;

    /** Called by PaymentService after a payment is persisted. */
    public function recordFromPayment(string $applicantId, string $invoiceId, string $paymentId): SubscriptionActionResponseData;

    public function cancel(SubscriptionModel $subscription): SubscriptionActionResponseData;
}
