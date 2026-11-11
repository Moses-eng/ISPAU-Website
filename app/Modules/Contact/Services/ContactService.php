<?php

namespace App\Modules\Contact\Services;

use App\Modules\Contact\Interfaces\ContactServiceInterface;
use App\Modules\Contact\DTOs\ContactActionResponseData;
use App\Modules\Contact\DTOs\ContactRequestData;
use App\Modules\Contact\DTOs\ContactResponseData;
use App\Modules\Contact\Models\ContactModel;
use App\Modules\Contact\RepositoryInterfaces\ContactRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ContactService implements ContactServiceInterface
{
    public function __construct(
        private readonly ContactRepositoryInterface $repository,
    ) {}

    // ==================== LIST ====================

    public function listAll(array $filters = []): ContactActionResponseData
    {
        try {
            $contacts = $this->repository->all($filters);

            $items = $contacts
                ->map(fn (ContactModel $c) => ContactResponseData::fromModel($c)->toArray())
                ->values()
                ->all();

            return ContactActionResponseData::success(
                message: 'Contacts fetched successfully.',
                contact: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Contact list failed', [
                'error'   => $e->getMessage(),
                'filters' => $filters,
            ]);
            return ContactActionResponseData::error('Failed to fetch contacts.');
        }
    }

    // ==================== SHOW ====================

    public function show(string $id): ContactActionResponseData
    {
        $contact = $this->repository->findById($id);
        if (! $contact) {
            return ContactActionResponseData::error('Contact not found.');
        }

        return ContactActionResponseData::success(
            message: 'Contact fetched successfully.',
            contact: ContactResponseData::fromModel($contact),
        );
    }

    // ==================== CREATE ====================

    public function create(ContactRequestData $data): ContactActionResponseData
    {
        try {
            return DB::transaction(function () use ($data) {
                $contact = $this->repository->create($data->toArray());

                Log::info('Contact created', ['contact_id' => $contact->id]);

                return ContactActionResponseData::success(
                    message: "Contact from {$contact->name} created successfully.",
                    contact: ContactResponseData::fromModel($contact),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Contact creation failed', ['error' => $e->getMessage()]);
            return ContactActionResponseData::error(
                'Creation failed: ' . $e->getMessage()
            );
        }
    }

    // ==================== UPDATE ====================

    public function update(ContactModel $contact, ContactRequestData $data): ContactActionResponseData
    {
        try {
            $updated = $this->repository->update($contact, $data->toArray());

            return ContactActionResponseData::success(
                message: 'Contact updated successfully.',
                contact: ContactResponseData::fromModel($updated),
            );
        } catch (\Throwable $e) {
            Log::error('Contact update failed', [
                'contact_id' => $contact->id,
                'error'      => $e->getMessage(),
            ]);
            return ContactActionResponseData::error('Failed to update contact.');
        }
    }

    // ==================== DELETE ====================

    public function delete(ContactModel $contact): ContactActionResponseData
    {
        try {
            $this->repository->delete($contact);

            Log::info('Contact deleted', [
                'contact_id' => $contact->id,
                'name'       => $contact->name,
            ]);

            return ContactActionResponseData::success(
                message: 'Contact deleted successfully.',
                contact: null,
            );
        } catch (\Throwable $e) {
            Log::error('Contact delete failed', [
                'contact_id' => $contact->id,
                'error'      => $e->getMessage(),
            ]);
            return ContactActionResponseData::error('Failed to delete contact.');
        }
    }
}
