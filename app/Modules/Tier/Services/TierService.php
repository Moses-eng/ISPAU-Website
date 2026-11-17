<?php

namespace App\Modules\Tier\Services;

use App\Modules\Tier\Interfaces\TierServiceInterface;
use App\Modules\Tier\DTOs\TierActionResponseData;
use App\Modules\Tier\DTOs\TierPublicListResponseData;
use App\Modules\Tier\DTOs\TierPublicResponseData;
use App\Modules\Tier\DTOs\TierRequestData;
use App\Modules\Tier\DTOs\TierResponseData;
use App\Modules\Tier\Models\TierModel;
use App\Modules\Tier\RepositoryInterfaces\TierRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TierService implements TierServiceInterface
{
    public function __construct(
        private readonly TierRepositoryInterface $repository,
    ) {}

    // ==================== LIST ====================

    public function listAll(array $filters = []): TierActionResponseData
    {
        try {
            $tiers = $this->repository->all($filters);

            $items = $tiers
                ->map(fn (TierModel $t) => TierResponseData::fromModel($t)->toArray())
                ->values()
                ->all();

            return TierActionResponseData::success(
                message: 'Tiers fetched successfully.',
                tier: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Tier list failed', [
                'error'   => $e->getMessage(),
                'filters' => $filters,
            ]);
            return TierActionResponseData::error('Failed to fetch tiers.');
        }
    }

    // ==================== SHOW ====================

    public function show(string $id): TierActionResponseData
    {
        $tier = $this->repository->findById($id);
        if (! $tier) {
            return TierActionResponseData::error('Tier not found.');
        }

        return TierActionResponseData::success(
            message: 'Tier fetched successfully.',
            tier: TierResponseData::fromModel($tier),
        );
    }

    // ==================== CREATE ====================

    public function create(TierRequestData $data): TierActionResponseData
    {
        try {
            return DB::transaction(function () use ($data) {
                $tier = $this->repository->create($data->toArray());

                Log::info('Tier created', ['tier_id' => $tier->id]);

                return TierActionResponseData::success(
                    message: "Tier {$tier->name} created successfully.",
                    tier: TierResponseData::fromModel($tier),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Tier creation failed', ['error' => $e->getMessage()]);
            return TierActionResponseData::error(
                'Creation failed: ' . $e->getMessage()
            );
        }
    }

    // ==================== UPDATE ====================

    public function update(TierModel $tier, TierRequestData $data): TierActionResponseData
    {
        try {
            $updated = $this->repository->update($tier, $data->toArray());

            return TierActionResponseData::success(
                message: 'Tier updated successfully.',
                tier: TierResponseData::fromModel($updated),
            );
        } catch (\Throwable $e) {
            Log::error('Tier update failed', [
                'tier_id' => $tier->id,
                'error'   => $e->getMessage(),
            ]);
            return TierActionResponseData::error('Failed to update tier.');
        }
    }

    // ==================== DELETE ====================

    public function delete(TierModel $tier): TierActionResponseData
    {
        try {
            $this->repository->delete($tier);

            Log::info('Tier deleted', [
                'tier_id' => $tier->id,
                'name'    => $tier->name,
            ]);

            return TierActionResponseData::success(
                message: 'Tier deleted successfully.',
                tier: null,
            );
        } catch (\Throwable $e) {
            Log::error('Tier delete failed', [
                'tier_id' => $tier->id,
                'error'   => $e->getMessage(),
            ]);
            return TierActionResponseData::error('Failed to delete tier.');
        }
    }
    // ==================== PUBLIC LIST ====================
    public function listPublic(): TierPublicListResponseData
    {
        try {
            $tiers = $this->repository->allPublicActive();

            $items = $tiers
                ->map(fn (TierModel $t) => TierPublicResponseData::fromModel($t)->toArray())
                ->values()
                ->all();

            return TierPublicListResponseData::success(
                message: 'Tiers fetched successfully.',
                items: $items,
            );
        } catch (\Throwable $e) {
            Log::error('Public tier list failed', ['error' => $e->getMessage()]);
            return TierPublicListResponseData::error('Failed to fetch tiers.');
        }
    }
}
