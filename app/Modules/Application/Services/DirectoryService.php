<?php

namespace App\Modules\Application\Services;

use App\Modules\Application\DTOs\DirectoryActionResponseData;
use App\Modules\Application\DTOs\DirectoryResponseData;
use App\Modules\Application\Models\ApplicationModel;
use Illuminate\Support\Facades\Log;

class DirectoryService
{
    public function list(array $filters = []): DirectoryActionResponseData
    {
        try {
            $query = ApplicationModel::query()->where('status', 'Active');

            if (!empty($filters['search'])) {
                $term = strtolower(trim($filters['search']));
                $query->where(function ($q) use ($term) {
                    $q->whereRaw('LOWER(legal_name) LIKE ?', ["%{$term}%"])
                      ->orWhereRaw('LOWER(trading_name) LIKE ?', ["%{$term}%"]);
                });
            }

            $applications = $query->orderBy('legal_name')->get();

            $items = $applications
                ->map(fn (ApplicationModel $app) => DirectoryResponseData::fromModel($app)->toArray())
                ->values()
                ->all();

            return DirectoryActionResponseData::success(
                message: 'Active members directory loaded successfully.',
                member: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Directory members list failed', ['error' => $e->getMessage()]);
            return DirectoryActionResponseData::error('Failed to load active members directory.');
        }
    }

    public function show(string $id): DirectoryActionResponseData
    {
        try {
            $app = ApplicationModel::where('status', 'Active')
                ->where('id', $id)
                ->first();

            if (!$app) {
                return DirectoryActionResponseData::error('Member profile not found or not currently active.');
            }

            return DirectoryActionResponseData::success(
                message: 'Member profile loaded.',
                member: DirectoryResponseData::fromModel($app),
            );
        } catch (\Throwable $e) {
            Log::error('Directory member show failed', ['id' => $id, 'error' => $e->getMessage()]);
            return DirectoryActionResponseData::error('Failed to load member profile.');
        }
    }
}
