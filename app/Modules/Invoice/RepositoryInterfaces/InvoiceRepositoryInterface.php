<?php

namespace App\Modules\Invoice\RepositoryInterfaces;

use App\Modules\Invoice\Models\InvoiceModel;
use Illuminate\Database\Eloquent\Collection;

interface InvoiceRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function findById(string $id): ?InvoiceModel;
    public function create(array $data): InvoiceModel;
    public function update(InvoiceModel $invoice, array $data): InvoiceModel;
    public function delete(InvoiceModel $invoice): bool;
}
