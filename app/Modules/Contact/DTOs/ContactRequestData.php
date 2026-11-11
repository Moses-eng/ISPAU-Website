<?php

namespace App\Modules\Contact\DTOs;

use Illuminate\Http\Request;

class ContactRequestData
{
    public function __construct(
        public readonly string  $name,
        public readonly string  $work_email,
        public readonly string  $organisation,
        public readonly string  $message,
        public readonly string  $enquiry_type,
        public readonly string  $status = 'active',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name:         $request->input('name'),
            work_email:   strtolower(trim($request->input('work_email'))),
            organisation: $request->input('organisation'),
            message:      $request->input('message'),
            enquiry_type: $request->input('enquiry_type'),
            status:       $request->input('status', 'active'),
        );
    }

    public function toArray(): array
    {
        return [
            'name'         => $this->name,
            'work_email'   => $this->work_email,
            'organisation' => $this->organisation,
            'message'      => $this->message,
            'enquiry_type' => $this->enquiry_type,
            'status'       => $this->status,
        ];
    }
}
