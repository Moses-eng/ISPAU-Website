<?php

namespace App\Modules\Payment\Repositories;

use App\Modules\Payment\Models\PaymentModel;
use App\Modules\Payment\RepositoryInterfaces\PaymentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class PaymentRepository implements PaymentRepositoryInterface
{
    public function __construct(private readonly PaymentModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        // ---- Search across payment_reference / period ----
        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('payment_reference', 'like', "%{$search}%")
                  ->orWhere('period', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['invoice_id'])) {
            $query->where('invoice_id', $filters['invoice_id']);
        }

        if (! empty($filters['applicant_id'])) {
            $query->where('applicant_id', $filters['applicant_id']);
        }

        if (! empty($filters['created_by'])) {
            $query->where('created_by', $filters['created_by']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['payment_reference'])) {
            $query->where('payment_reference', 'like', "%{$filters['payment_reference']}%");
        }

        // ---- Sorting ----
        $sort  = $filters['sort']  ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function findById(string $id): ?PaymentModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): PaymentModel
    {
        return $this->model->create($data);
    }

    public function update(PaymentModel $payment, array $data): PaymentModel
    {
        $payment->update($data);
        return $payment->fresh();
    }

    public function delete(PaymentModel $payment): bool
    {
        return (bool) $payment->delete();
    }
}
