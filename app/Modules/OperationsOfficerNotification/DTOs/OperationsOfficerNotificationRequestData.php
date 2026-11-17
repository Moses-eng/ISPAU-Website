<?php

namespace App\Modules\OperationsOfficerNotification\DTOs;

use Illuminate\Http\Request;

class OperationsOfficerNotificationRequestData
{
    public function __construct(
        public readonly string  $title,
        public readonly string  $message,
        public readonly string  $type,
        public readonly string  $applicant_id,
        public readonly ?string $applicant_name = null,
        public readonly ?string $applicant_email = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            title:           (string) $request->input('title'),
            message:         (string) $request->input('message'),
            type:            (string) $request->input('type', 'info'),
            applicant_id:    (string) $request->input('applicant_id'),
            applicant_name:  $request->input('applicant_name'),
            applicant_email: $request->input('applicant_email'),
        );
    }

    public function toArray(): array
    {
        return [
            'title'           => $this->title,
            'message'         => $this->message,
            'type'            => $this->type,
            'applicant_id'    => $this->applicant_id,
            'applicant_name'  => $this->applicant_name,
            'applicant_email' => $this->applicant_email,
        ];
    }
}
