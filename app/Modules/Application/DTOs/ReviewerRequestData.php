<?php

namespace App\Modules\Application\DTOs;

use Illuminate\Http\Request;

class ReviewerRequestData
{
    public function __construct(
        public readonly string  $applicationId,
        public readonly string  $reviewerId,
        public readonly string  $reviewerName,
        public readonly string  $assignedBy,
        public readonly ?string $assignedByName = null,
        public readonly string  $status = 'Assigned',
    ) {}

    public static function fromRequest(Request $request, string $assignedBy): self
    {
        return new self(
            applicationId:    (string) $request->input('applicationId'),
            reviewerId:       (string) $request->input('reviewerId'),
            reviewerName:     (string) $request->input('reviewerName'),
            assignedBy:       $assignedBy,
            assignedByName:   $request->input('assignedByName'),
            status:           (string) $request->input('status', 'Assigned'),
        );
    }

    public function toArray(): array
    {
        return [
            'application_id'   => $this->applicationId,
            'reviewer_id'      => $this->reviewerId,
            'reviewer_name'    => $this->reviewerName,
            'assigned_by'      => $this->assignedBy,
            'assigned_by_name' => $this->assignedByName,
            'status'           => $this->status,
            'assigned_at'      => now(),
        ];
    }
}
