<?php

namespace App\Modules\Application\DTOs;

use Illuminate\Http\Request;

class ClarificationRequestData
{
    public function __construct(
        public readonly string  $applicationId,
        public readonly string  $reviewerId,
        public readonly string  $reviewerName,
        public readonly string  $assignedBy,
        public readonly ?string $assignedByName = null,
        public readonly ?string $subject = null,
        public readonly ?string $message = null,
        public readonly array   $items = [],
        public readonly ?string $response = null,
        public readonly string  $status = 'Open',
    ) {}

    public static function fromRequest(Request $request, string $assignedBy): self
    {
        return new self(
            applicationId:  (string) $request->input('applicationId'),
            reviewerId:     (string) $request->input('reviewerId'),
            reviewerName:   (string) $request->input('reviewerName'),
            assignedBy:     $assignedBy,
            assignedByName: $request->input('assignedByName'),
            subject:        $request->input('subject'),
            message:        $request->input('message'),
            items:          (array) $request->input('items', []),
            response:       $request->input('response'),
            status:         (string) $request->input('status', 'Open'),
        );
    }

    /**
     * Only the fields that are safe to persist on create/raise.
     */
    public function toCreateArray(): array
    {
        return [
            'application_id'   => $this->applicationId,
            'reviewer_id'      => $this->reviewerId,
            'reviewer_name'    => $this->reviewerName,
            'assigned_by'      => $this->assignedBy,
            'assigned_by_name' => $this->assignedByName,
            'subject'          => $this->subject ?? 'Clarification requested',
            'message'          => $this->message ?? '',
            'items'            => $this->items,
            'status'           => 'Open',
            'requested_at'     => now(),           // ← date auto-picked
        ];
    }
}
