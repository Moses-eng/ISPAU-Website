<?php

namespace App\Modules\Application\DTOs;

use Illuminate\Http\Request;

class ClarificationRequestData
{
    public function __construct(
        public readonly string $applicationId,
        public readonly string $reviewerId,
        public readonly string $reviewerName,
        public readonly string $assignedBy,
        public readonly ?string $assignedByName,
        public readonly string $subject,
        public readonly string $message,
        public readonly array $items = [],
        public readonly ?string $applicantEmail = null,
        public readonly ?string $applicantName = null,
    ) {}

    public static function fromRequest(Request $request, string $assignedBy): self
    {
        return new self(
            applicationId:  (string) $request->input('applicationId'),
            reviewerId:     (string) $request->input('reviewerId'),
            reviewerName:   (string) $request->input('reviewerName'),
            assignedBy:     $assignedBy,
            assignedByName: $request->input('assignedByName') ? (string) $request->input('assignedByName') : null,
            subject:        (string) $request->input('subject'),
            message:        (string) $request->input('message'),
            items:          (array) $request->input('items', []),
            applicantEmail: $request->input('applicantEmail') ? (string) $request->input('applicantEmail') : null,
            applicantName:  $request->input('applicantName') ? (string) $request->input('applicantName') : null,
        );
    }

    public function toCreateArray(): array
    {
        return [
            'application_id'   => $this->applicationId,
            'reviewer_id'      => $this->reviewerId,
            'reviewer_name'    => $this->reviewerName,
            'assigned_by'      => $this->assignedBy,
            'assigned_by_name' => $this->assignedByName,
            'subject'          => $this->subject,
            'message'          => $this->message,
            'items'            => $this->items,
            'status'           => 'Open',
            'requested_at'     => now(),
        ];
    }
}
