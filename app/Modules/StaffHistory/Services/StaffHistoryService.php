<?php

namespace App\Modules\StaffHistory\Services;

use App\Modules\StaffHistory\DTOs\StaffSessionListResponseData;
use App\Modules\StaffHistory\DTOs\StaffSessionResponseData;
use App\Modules\StaffHistory\Interfaces\StaffHistoryServiceInterface;
use App\Modules\StaffHistory\RepositoryInterfaces\StaffHistoryRepositoryInterface;
use App\Modules\SystemUser\Models\SystemUserModel;
use Illuminate\Support\Facades\Log;

class StaffHistoryService implements StaffHistoryServiceInterface
{
    private const SECTION_LABELS = [
        'overview'             => 'Overview',
        'membership'           => 'Membership',
        'finance'              => 'Finance',
        'applications'         => 'Applications',
        'members'              => 'Members',
        'billing'              => 'Billing',
        'communications'       => 'Email templates',
        'reports'              => 'Reports',
        'administration'       => 'Administration',
        'staff-activity'       => 'Staff activity',
        'membership-activity'  => 'Membership activity',
        'finance-activity'     => 'Finance activity',
    ];

    public function __construct(
        private readonly StaffHistoryRepositoryInterface $repository,
    ) {}

    public function listFor(
        SystemUserModel $viewer,
        ?string $person,
        ?string $from,
        ?string $to,
        int $limit = 100,
    ): StaffSessionListResponseData {
        // Staff history is sensitive → super_admin only for now
        if (! $viewer->isSuperAdmin()) {
            return StaffSessionListResponseData::error('Access denied.');
        }

        try {
            $actorIds = $person ? [$person] : [];
            $grouped  = $this->repository->sessions($actorIds, $from, $to, $limit);

            $items = $grouped->map(function ($rows, $sessionId) {
                // Already sorted DESC by occurred_at from the repo
                $login  = $rows->firstWhere('kind', 'login');
                $logout = $rows->firstWhere('kind', 'logout');
                $visit  = $rows->firstWhere('kind', 'view');
                $first  = $rows->first();

                $loginAt = $login?->occurred_at ?? $first?->occurred_at;

                return (new StaffSessionResponseData(
                    session_id:         $sessionId,
                    actor_id:           $first->actor_id,
                    actor_name:         $first->actor_name,
                    roles:              $first->roles ?? [],
                    login_at:           optional($loginAt)->toIso8601String() ?? '',
                    logout_at:          optional($logout?->occurred_at)->toIso8601String(),
                    logout_reason:      $logout?->summary,
                    last_section:       $visit?->section,
                    last_section_label: $visit?->section
                        ? (self::SECTION_LABELS[$visit->section] ?? $visit->section)
                        : null,
                    last_visit_at:      optional($visit?->occurred_at)->toIso8601String(),
                    event_count:        $rows->count(),
                ))->toArray();
            })->values()->all();

            // Sort sessions by login_at DESC
            usort($items, fn ($a, $b) => strcmp($b['login_at'], $a['login_at']));

            return StaffSessionListResponseData::success(
                'Staff session history fetched successfully.',
                $items,
                ['person' => $person, 'from' => $from, 'to' => $to],
            );
        } catch (\Throwable $e) {
            Log::error('Staff session history fetch failed', [
                'viewer_id' => $viewer->id,
                'error'     => $e->getMessage(),
            ]);
            return StaffSessionListResponseData::error('Failed to fetch staff history.');
        }
    }
}
