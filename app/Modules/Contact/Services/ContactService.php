<?php

namespace App\Modules\Contact\Services;

use App\Helpers\AdminNotificationHelper;
use App\Mail\ContactSubmittedMail;
use App\Modules\Contact\DTOs\ContactActionResponseData;
use App\Modules\Contact\DTOs\ContactRequestData;
use App\Modules\Contact\DTOs\ContactResponseData;
use App\Modules\Contact\Interfaces\ContactServiceInterface;
use App\Modules\Contact\Models\ContactModel;
use App\Modules\Contact\RepositoryInterfaces\ContactRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Helpers\MembershipAdminNotificationHelper;
use App\Helpers\OperationsOfficerAdminNotificationHelper;

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
            // 1. Transaction strictly for persistence
            $contact = DB::transaction(function () use ($data) {
                return $this->repository->create($data->toArray());
            });

            Log::info('Contact enquiry created successfully', ['contact_id' => $contact->id]);

            // -------------------------------------------------------------
            // Side-effects outside the transaction
            // -------------------------------------------------------------
            $frontendUrl    = rtrim((string) env('FRONTEND_URL', ''));
            $adminPortalUrl = rtrim((string) env('ADMIN_FRONTEND_URL', ''));

            // 1. Send confirmation email to the User
            if (! empty($contact->work_email)) {
                try {
                    Mail::to($contact->work_email, $contact->name)
                        ->send(new ContactSubmittedMail(
                            contact: $contact,
                            portalUrl: $frontendUrl,
                            isInternalNotice: false
                        ));
                    Log::info('Contact confirmation email sent to user', [
                        'contact_id' => $contact->id,
                        'recipient'  => $contact->work_email,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Contact confirmation email failed to send', [
                        'contact_id' => $contact->id,
                        'recipient'  => $contact->work_email,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            // 2. Send notification email to Admin / Organisation
            $orgNotificationEmail = env('APP_NOTIFICATION_EMAIL', config('mail.from.address'));
            if ($orgNotificationEmail) {
                try {
                    Mail::to($orgNotificationEmail)
                        ->send(new ContactSubmittedMail(
                            contact: $contact,
                            portalUrl: $adminPortalUrl,
                            isInternalNotice: true
                        ));
                    Log::info('Contact alert email sent to organisation admin', [
                        'contact_id' => $contact->id,
                        'recipient'  => $orgNotificationEmail,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Contact admin notification email failed to send', [
                        'contact_id' => $contact->id,
                        'recipient'  => $orgNotificationEmail,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            // 3. Create Admin in-app notification via AdminNotificationHelper
            try {
                $orgLabel = $contact->organisation ? " ({$contact->organisation})" : '';
                AdminNotificationHelper::createNotification(
                    title: 'New Contact Enquiry',
                    message: "New {$contact->enquiry_type} received from '{$contact->name}'{$orgLabel}.",
                    applicantId: $contact->id,
                    applicantName: $contact->name,
                    applicantEmail: $contact->work_email,
                    type: 'info'
                );
                MembershipAdminNotificationHelper::notifyContactEnquiry($contact);
                OperationsOfficerAdminNotificationHelper::notifyContactEnquiry($contact);

            } catch (\Throwable $e) {
                Log::warning('Failed to create in-app admin notification for contact', [
                    'contact_id' => $contact->id,
                    'error'      => $e->getMessage(),
                ]);
            }

            return ContactActionResponseData::success(
                message: "Contact from {$contact->name} created successfully.",
                contact: ContactResponseData::fromModel($contact),
            );
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
