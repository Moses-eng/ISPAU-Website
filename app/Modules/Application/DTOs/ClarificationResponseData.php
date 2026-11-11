<?php

namespace App\Modules\Application\DTOs;

use App\Modules\Application\Models\ClarificationModel;

class ClarificationResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $applicationId,
        public readonly string  $reviewerId,
        public readonly string  $reviewerName,
        public readonly string  $assignedBy,
        public readonly ?string $assignedByName,
        public readonly string  $subject,
        public readonly string  $message,
        public readonly array   $items,
        public readonly ?string $response,
        public readonly ?string $respondedAt,
        public readonly string  $status,
        public readonly ?string $requestedAt,
        public readonly ?string $createdAt = null,
        public readonly ?string $updatedAt = null,
    ) {}

    public static function fromModel(ClarificationModel $m): self
    {
        return new self(
            id:              $m->id,
            applicationId:   $m->application_id,
            reviewerId:      $m->reviewer_id,
            reviewerName:    $m->reviewer_name,
            assignedBy:      $m->assigned_by,
            assignedByName:  $m->assigned_by_name,
            subject:         $m->subject,
            message:         $m->message,
            items:           $m->items ?? [],
            response:        $m->response,
            respondedAt:     optional($m->responded_at)->toIso8601String(),
            status:          $m->status,
            requestedAt:     optional($m->requested_at)->toIso8601String(),
            createdAt:       optional($m->created_at)->toIso8601String(),
            updatedAt:       optional($m->updated_at)->toIso8601String(),
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
            'subject'          => $this->subject,
            'message'          => $this->message,
            'items'            => $this->items,
            'response'         => $this->response,
            'responded_at'     => $this->respondedAt,
            'status'           => $this->status,
            'requested_at'     => $this->requestedAt,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
        ];
    }
}
