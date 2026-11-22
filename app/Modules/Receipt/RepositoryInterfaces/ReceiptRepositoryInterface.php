<?php

namespace App\Modules\Receipt\RepositoryInterfaces;

use App\Modules\Receipt\Models\ReceiptModel;
use Illuminate\Database\Eloquent\Collection;

interface ReceiptRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function findById(string $id): ?ReceiptModel;
    public function findByInvoiceAndApplicant(string $invoiceId, string $applicantId): ?ReceiptModel;
    public function create(array $data): ReceiptModel;
    public function update(ReceiptModel $receipt, array $data): ReceiptModel;
    public function delete(ReceiptModel $receipt): bool;
}
