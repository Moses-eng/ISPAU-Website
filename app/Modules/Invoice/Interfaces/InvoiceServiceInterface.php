<?php

namespace App\Modules\Invoice\Interfaces;

use App\Modules\Invoice\DTOs\InvoiceActionResponseData;
use App\Modules\Invoice\DTOs\InvoiceRequestData;
use App\Modules\Invoice\Models\InvoiceModel;

interface InvoiceServiceInterface
{
    public function listAll(array $filters = []): InvoiceActionResponseData;
    public function show(string $id): InvoiceActionResponseData;
    public function create(InvoiceRequestData $data): InvoiceActionResponseData;
    public function update(InvoiceModel $invoice, InvoiceRequestData $data): InvoiceActionResponseData;
    public function delete(InvoiceModel $invoice): InvoiceActionResponseData;
}
