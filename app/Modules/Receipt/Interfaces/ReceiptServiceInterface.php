<?php

namespace App\Modules\Receipt\Interfaces;

use App\Modules\Receipt\DTOs\ReceiptActionResponseData;
use App\Modules\Receipt\DTOs\ReceiptRequestData;
use App\Modules\Receipt\Models\ReceiptModel;

interface ReceiptServiceInterface
{
    public function listAll(array $filters = []): ReceiptActionResponseData;
    public function show(string $id): ReceiptActionResponseData;
    public function create(ReceiptRequestData $data): ReceiptActionResponseData;
    public function update(ReceiptModel $receipt, ReceiptRequestData $data): ReceiptActionResponseData;
    public function delete(ReceiptModel $receipt): ReceiptActionResponseData;

    /**
     * Applicant uploads a receipt PDF for a given invoice.
     * `$applicantId` is taken from the authenticated applicant (never client input).
     */
    public function uploadReceipt(string $invoiceId, string $applicantId, ReceiptRequestData $data): ReceiptActionResponseData;
}
