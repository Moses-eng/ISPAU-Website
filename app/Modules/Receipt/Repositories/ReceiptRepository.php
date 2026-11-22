<?php

namespace App\Modules\Receipt\Repositories;

use App\Modules\Receipt\Models\ReceiptModel;
use App\Modules\Receipt\RepositoryInterfaces\ReceiptRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ReceiptRepository implements ReceiptRepositoryInterface
{
    public function __construct(private readonly ReceiptModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        if (! empty($filters['invoice_id'])) {
            $query->where('invoice_id', $filters['invoice_id']);
        }

        if (! empty($filters['applicant_id'])) {
            $query->where('applicant_id', $filters['applicant_id']);
        }

        // Search across the ids (useful for admin lookup)
        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('invoice_id',   'like', "%{$search}%")
                  ->orWhere('applicant_id', 'like', "%{$search}%")
                  ->orWhere('receipt_id',   'like', "%{$search}%");
            });
        }

        $sort  = $filters['sort']  ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function findById(string $id): ?ReceiptModel
    {
        return $this->model->find($id);
    }

    public function findByInvoiceAndApplicant(string $invoiceId, string $applicantId): ?ReceiptModel
    {
        return $this->model->newQuery()
            ->where('invoice_id', $invoiceId)
            ->where('applicant_id', $applicantId)
            ->first();
    }

    public function create(array $data): ReceiptModel
    {
        return $this->model->create($data);
    }

    public function update(ReceiptModel $receipt, array $data): ReceiptModel
    {
        $receipt->update($data);
        return $receipt->fresh();
    }

    public function delete(ReceiptModel $receipt): bool
    {
        return (bool) $receipt->delete();
    }
}
