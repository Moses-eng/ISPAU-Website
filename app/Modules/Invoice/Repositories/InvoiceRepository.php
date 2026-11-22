<?php

namespace App\Modules\Invoice\Repositories;

use App\Modules\Invoice\Models\InvoiceModel;
use App\Modules\Invoice\RepositoryInterfaces\InvoiceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class InvoiceRepository implements InvoiceRepositoryInterface
{
    public function __construct(private readonly InvoiceModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        // ---- Search across invoice_number / membership_period ----
        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('membership_period', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['start_date_from'])) {
            $query->whereDate('start_date', '>=', $filters['start_date_from']);
        }
        if (! empty($filters['end_date_to'])) {
            $query->whereDate('end_date', '<=', $filters['end_date_to']);
        }

        if (! empty($filters['applicant_id'])) {
            $query->where('applicant_id', $filters['applicant_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (! empty($filters['confirmed_by'])) {
            $query->where('confirmed_by', $filters['confirmed_by']);
        }

        // ---- Sorting ----
        $sort  = $filters['sort']  ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function findById(string $id): ?InvoiceModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): InvoiceModel
    {
        return $this->model->create($data);
    }

    public function update(InvoiceModel $invoice, array $data): InvoiceModel
    {
        $invoice->update($data);
        return $invoice->fresh();
    }

    public function delete(InvoiceModel $invoice): bool
    {
        return (bool) $invoice->delete();
    }
}
