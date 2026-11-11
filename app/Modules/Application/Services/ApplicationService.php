<?php

namespace App\Modules\Application\Services;

use App\Modules\Application\Interfaces\ApplicationServiceInterface;
use App\Modules\Application\DTOs\ApplicationActionResponseData;
use App\Modules\Application\DTOs\ApplicationRequestData;
use App\Modules\Application\DTOs\ApplicationResponseData;
use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Application\RepositoryInterfaces\ApplicationRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ApplicationService implements ApplicationServiceInterface
{
    public function __construct(
        private readonly ApplicationRepositoryInterface $repository,
        private readonly ApplicationAttachmentService   $attachments,
    ) {}

    public function listAll(array $filters = []): ApplicationActionResponseData
    {
        try {
            $apps = $this->repository->all($filters);
            $items = $apps
                ->map(fn (ApplicationModel $a) => ApplicationResponseData::fromModel($a)->toArray())
                ->values()
                ->all();

            return ApplicationActionResponseData::success(
                message: 'Applications fetched successfully.',
                application: null,
                payload: ['items' => $items, 'total' => count($items)],
            );
        } catch (\Throwable $e) {
            Log::error('Application list failed', ['error' => $e->getMessage()]);
            return ApplicationActionResponseData::error('Failed to fetch applications.');
        }
    }

    public function show(string $id): ApplicationActionResponseData
    {
        $app = $this->repository->findById($id);
        if (! $app) {
            return ApplicationActionResponseData::error('Application not found.');
        }

        return ApplicationActionResponseData::success(
            message: 'Application fetched successfully.',
            application: ApplicationResponseData::fromModel($app),
        );
    }

    public function create(ApplicationRequestData $data): ApplicationActionResponseData
    {
        try {
            return DB::transaction(function () use ($data) {
                // If an existing draft exists for this ID or email, update it to Submitted
                $existing = null;
                if ($data->id) {
                    $existing = $this->repository->findById($data->id);
                } elseif (! empty($data->businessEmail)) {
                    $existing = ApplicationModel::where('business_email', $data->businessEmail)
                        ->where('status', 'Draft')
                        ->first();
                }

                $payload = $data->toArray();
                $payload['status'] = 'Submitted';

                if ($existing) {
                    $app = $this->repository->update($existing, $payload);
                } else {
                    $app = $this->repository->create($payload);
                }

                if (! empty($data->uploads)) {
                    $paths = $this->attachments->storeAll($app->id, $data->uploads);
                    if (! empty($paths)) {
                        $merged = array_merge($app->attachments ?? [], $paths);
                        $app = $this->repository->update($app, ['attachments' => $merged]);
                    }
                }

                Log::info('Application submitted', ['application_id' => $app->id]);

                return ApplicationActionResponseData::success(
                    message: "Application for {$app->legal_name} submitted successfully.",
                    application: ApplicationResponseData::fromModel($app),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Application creation failed', ['error' => $e->getMessage()]);
            return ApplicationActionResponseData::error('Submission failed: ' . $e->getMessage());
        }
    }

    public function saveDraft(ApplicationRequestData $data): ApplicationActionResponseData
    {
        try {
            return DB::transaction(function () use ($data) {
                $existing = null;
                if ($data->id) {
                    $existing = $this->repository->findById($data->id);
                } elseif (! empty($data->businessEmail)) {
                    $existing = ApplicationModel::where('business_email', $data->businessEmail)
                        ->where('status', 'Draft')
                        ->first();
                }

                $payload = array_filter($data->toArray(), fn($v) => ! is_null($v));
                $payload['status'] = 'Draft';

                if ($existing) {
                    $app = $this->repository->update($existing, $payload);
                } else {
                    $app = $this->repository->create($payload);
                }

                if (! empty($data->uploads)) {
                    $paths = $this->attachments->storeAll($app->id, $data->uploads);
                    if (! empty($paths)) {
                        $merged = array_merge($app->attachments ?? [], $paths);
                        $app = $this->repository->update($app, ['attachments' => $merged]);
                    }
                }

                return ApplicationActionResponseData::success(
                    message: 'Draft saved to server successfully.',
                    application: ApplicationResponseData::fromModel($app),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Draft save failed', ['error' => $e->getMessage()]);
            return ApplicationActionResponseData::error('Failed to save draft: ' . $e->getMessage());
        }
    }

    public function update(ApplicationModel $application, ApplicationRequestData $data): ApplicationActionResponseData
    {
        try {
            // Only update fields the client actually sent.
            // Anything the request omitted (i.e. DTO value is null) is left untouched.
            $payload = array_filter(
                $data->toArray(),
                fn ($value) => $value !== null
            );

            // Update on the instance, not via the repository's wholesale update,
            // so we don't need to worry about repository semantics.
            $application->update($payload);
            $app = $application->fresh();

            if (! empty($data->uploads)) {
                $paths = $this->attachments->storeAll($app->id, $data->uploads);
                if (! empty($paths)) {
                    $merged = array_merge($app->attachments ?? [], $paths);
                    $app = $this->repository->update($app, ['attachments' => $merged]);
                }
            }

            return ApplicationActionResponseData::success(
                message: 'Application updated successfully.',
                application: ApplicationResponseData::fromModel($app),
            );
        } catch (\Throwable $e) {
            Log::error('Application update failed', [
                'application_id' => $application->id,
                'error'          => $e->getMessage(),
            ]);
            return ApplicationActionResponseData::error('Failed to update application.');
        }
    }
    public function update1(ApplicationModel $application, ApplicationRequestData $data): ApplicationActionResponseData
    {
        try {
            $app = $this->repository->update($application, $data->toArray());

            if (! empty($data->uploads)) {
                $paths = $this->attachments->storeAll($app->id, $data->uploads);
                if (! empty($paths)) {
                    $merged = array_merge($app->attachments ?? [], $paths);
                    $app = $this->repository->update($app, ['attachments' => $merged]);
                }
            }

            return ApplicationActionResponseData::success(
                message: 'Application updated successfully.',
                application: ApplicationResponseData::fromModel($app),
            );
        } catch (\Throwable $e) {
            Log::error('Application update failed', [
                'application_id' => $application->id,
                'error'          => $e->getMessage(),
            ]);
            return ApplicationActionResponseData::error('Failed to update application.');
        }
    }

    public function delete(ApplicationModel $application): ApplicationActionResponseData
    {
        try {
            $this->attachments->deleteDirectory($application->id);
            $this->repository->delete($application);

            Log::info('Application deleted', ['application_id' => $application->id]);

            return ApplicationActionResponseData::success(
                message: 'Application deleted successfully.',
                application: null,
            );
        } catch (\Throwable $e) {
            Log::error('Application delete failed', [
                'application_id' => $application->id,
                'error'          => $e->getMessage(),
            ]);
            return ApplicationActionResponseData::error('Failed to delete application.');
        }
    }
    public function downloadSummaryPdf(string $id)
    {
        $app = $this->repository->findById($id);
        if (! $app) {
            abort(404, 'Application not found.');
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.application_summary', [
            'app' => $app,
        ])
        ->setPaper('a4', 'portrait')
        ->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled'      => true,
            'defaultFont'          => 'sans-serif',
        ]);

        $safeName = \Illuminate\Support\Str::slug($app->legal_name ?: $app->id);
        $filename = "ISPAU_Application_{$safeName}.pdf";

        return $pdf->download($filename);
    }
}
