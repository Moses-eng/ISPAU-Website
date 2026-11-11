<?php

namespace App\Modules\Application\DTOs;

use App\Modules\Application\Models\ReviewerModel;

class ReviewerResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $applicationId,
        public readonly string  $reviewerId,
        public readonly string  $reviewerName,
        public readonly string  $assignedBy,
        public readonly ?string $assignedByName,
        public readonly string  $status,
        public readonly ?string $assignedAt = null,
        public readonly ?string $completedAt = null,
        public readonly ?string $createdAt = null,
        public readonly ?string $updatedAt = null,
    ) {}

    public static function fromModel(ReviewerModel $m): self
    {
        return new self(
            id:             $m->id,
            applicationId:  $m->application_id,
            reviewerId:     $m->reviewer_id,
            reviewerName:   $m->reviewer_name,
            assignedBy:     $m->assigned_by,
            assignedByName: $m->assigned_by_name,
            status:         $m->status,
            assignedAt:     optional($m->assigned_at)->toIso8601String(),
            completedAt:    optional($m->completed_at)->toIso8601String(),
            createdAt:      optional($m->created_at)->toIso8601String(),
            updatedAt:      optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'               => $this->id,
            'application_id'   => $this->applicationId,
            'reviewer_id'      => $this->reviewerId,
            'reviewer_name'    => $this->reviewerName,
            'assigned_by'      => $this->assignedBy,
            'assigned_by_name' => $this->assignedByName,
            'status'           => $this->status,
            'assigned_at'      => $this->assignedAt,
            'completed_at'     => $this->completedAt,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
        ];
    }
}
