<?php

namespace App\Modules\Payment\Interfaces;

use App\Modules\Payment\DTOs\PaymentActionResponseData;
use App\Modules\Payment\DTOs\PaymentRequestData;
use App\Modules\Payment\Models\PaymentModel;

interface PaymentServiceInterface
{
    public function listAll(array $filters = []): PaymentActionResponseData;
    public function show(string $id): PaymentActionResponseData;
    public function create(PaymentRequestData $data): PaymentActionResponseData;
    public function update(PaymentModel $payment, PaymentRequestData $data): PaymentActionResponseData;
    public function delete(PaymentModel $payment): PaymentActionResponseData;
}
