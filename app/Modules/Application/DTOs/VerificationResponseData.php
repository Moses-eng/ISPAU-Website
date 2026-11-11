<?php

namespace App\Modules\Application\DTOs;

use App\Modules\Application\Models\VerificationModel;

class VerificationResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $applicationId,
        public readonly string  $reviewerId,
        public readonly string  $reviewerName,
        public readonly string  $assignedBy,
        public readonly ?string $assignedByName,
        public readonly array   $checks,
        public readonly string  $status,
        public readonly ?string $recordedAt,
        public readonly ?string $createdAt = null,
        public readonly ?string $updatedAt = null,
    ) {}

    public static function fromModel(VerificationModel $m): self
    {
        return new self(
            id:             $m->id,
            applicationId:  $m->application_id,
            reviewerId:     $m->reviewer_id,
            reviewerName:   $m->reviewer_name,
            assignedBy:     $m->assigned_by,
            assignedByName: $m->assigned_by_name,
            checks: [
                'registration' => [
                    'label'  => 'Organisation registration',
                    'result' => $m->registration_result,
                    'note'   => $m->registration_note,
                ],
                'authority' => [
                    'label'  => 'Representative authority',
                    'result' => $m->authority_result,
                    'note'   => $m->authority_note,
                ],
                'regulatory' => [
                    'label'  => 'Applicable regulatory evidence',
                    'result' => $m->regulatory_result,
                    'note'   => $m->regulatory_note,
                ],
            ],
            status:     $m->status,
            recordedAt: optional($m->recorded_at)->toIso8601String(),
            createdAt:  optional($m->created_at)->toIso8601String(),
            updatedAt:  optional($m->updated_at)->toIso8601String(),
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
            'checks'           => $this->checks,
            'status'           => $this->status,
            'recorded_at'      => $this->recordedAt,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
        ];
    }
}
