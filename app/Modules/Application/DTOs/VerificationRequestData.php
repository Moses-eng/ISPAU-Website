<?php

namespace App\Modules\Application\DTOs;

use Illuminate\Http\Request;

class VerificationRequestData
{
    public function __construct(
        public readonly string  $applicationId,
        public readonly string  $reviewerId,
        public readonly string  $reviewerName,
        public readonly string  $assignedBy,
        public readonly ?string $assignedByName,
        public readonly string  $registrationResult,
        public readonly string  $registrationNote,
        public readonly string  $authorityResult,
        public readonly string  $authorityNote,
        public readonly string  $regulatoryResult,
        public readonly string  $regulatoryNote,
    ) {}

    /**
     * Maps the workspace-dialog fields:
     *   result-0 / note-0 → registration
     *   result-1 / note-1 → authority
     *   result-2 / note-2 → regulatory
     */
    public static function fromRequest(Request $request, string $assignedBy): self
    {
        return new self(
            applicationId:    (string) $request->input('applicationId'),
            reviewerId:       (string) $request->input('reviewerId'),
            reviewerName:     (string) $request->input('reviewerName'),
            assignedBy:       $assignedBy,
            assignedByName:   $request->input('assignedByName'),
            registrationResult: (string) $request->input('result-0'),
            registrationNote:   (string) $request->input('note-0'),
            authorityResult:    (string) $request->input('result-1'),
            authorityNote:      (string) $request->input('note-1'),
            regulatoryResult:   (string) $request->input('result-2'),
            regulatoryNote:     (string) $request->input('note-2'),
        );
    }

    public function toCreateArray(): array
    {
        return [
            'application_id'      => $this->applicationId,
            'reviewer_id'         => $this->reviewerId,
            'reviewer_name'       => $this->reviewerName,
            'assigned_by'         => $this->assignedBy,
            'assigned_by_name'    => $this->assignedByName,
            'registration_result' => $this->registrationResult,
            'registration_note'   => $this->registrationNote,
            'authority_result'    => $this->authorityResult,
            'authority_note'      => $this->authorityNote,
            'regulatory_result'   => $this->regulatoryResult,
            'regulatory_note'     => $this->regulatoryNote,
            'status'              => 'Recorded',
            'recorded_at'         => now(),          // ← date auto-picked
        ];
    }
}
