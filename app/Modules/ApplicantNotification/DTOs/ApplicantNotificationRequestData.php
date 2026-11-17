<?php

namespace App\Modules\ApplicantNotification\DTOs;

use Illuminate\Http\Request;

class ApplicantNotificationRequestData
{
    public function __construct(
        public readonly string  $title,
        public readonly string  $message,
        public readonly string  $type = 'info',
        public readonly ?string $applicant_id = null,
        public readonly ?string $applicant_name = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            title:          (string) $request->input('title'),
            message:        (string) $request->input('message'),
            type:           (string) $request->input('type', 'info'),
            applicant_id:   $request->input('applicant_id'),
            applicant_name: $request->input('applicant_name'),
        );
    }

    public function toArray(): array
    {
        return [
            'title'          => $this->title,
            'message'        => $this->message,
            'type'           => $this->type,
            'applicant_id'   => $this->applicant_id,
            'applicant_name' => $this->applicant_name,
        ];
    }
}
