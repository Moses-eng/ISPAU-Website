<?php

namespace App\Modules\Contact\Repositories;

use App\Modules\Contact\Models\ContactModel;
use App\Modules\Contact\RepositoryInterfaces\ContactRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ContactRepository implements ContactRepositoryInterface
{
    public function __construct(private readonly ContactModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        // ---- Search across name / work_email / organisation / message / enquiry_type ----
        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name',         'like', "%{$search}%")
                  ->orWhere('work_email', 'like', "%{$search}%")
                  ->orWhere('organisation', 'like', "%{$search}%")
                  ->orWhere('message',    'like', "%{$search}%")
                  ->orWhere('enquiry_type', 'like', "%{$search}%");
            });
        }

        // ---- Filter by status ----
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // ---- Filter by enquiry_type ----
        if (! empty($filters['enquiry_type'])) {
            $query->where('enquiry_type', 'like', "%{$filters['enquiry_type']}%");
        }

        // ---- Filter by organisation ----
        if (! empty($filters['organisation'])) {
            $query->where('organisation', 'like', "%{$filters['organisation']}%");
        }

        // ---- Sorting ----
        $sort  = $filters['sort']  ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function findById(string $id): ?ContactModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): ContactModel
    {
        return $this->model->create($data);
    }

    public function update(ContactModel $contact, array $data): ContactModel
    {
        $contact->update($data);
        return $contact->fresh();
    }

    public function delete(ContactModel $contact): bool
    {
        return (bool) $contact->delete();
    }
}
