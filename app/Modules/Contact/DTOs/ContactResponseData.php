<?php

namespace App\Modules\Contact\DTOs;

use App\Modules\Contact\Models\ContactModel;

class ContactResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $name,
        public readonly string  $work_email,
        public readonly string  $organisation,
        public readonly string  $message,
        public readonly string  $enquiry_type,
        public readonly string  $status,
        public readonly ?string $created_at = null,
        public readonly ?string $updated_at = null,
    ) {}

    public static function fromModel(ContactModel $m): self
    {
        return new self(
            id:           $m->id,
            name:         $m->name,
            work_email:   $m->work_email,
            organisation: $m->organisation,
            message:      $m->message,
            enquiry_type: $m->enquiry_type,
            status:       $m->status,
            created_at:   optional($m->created_at)->toIso8601String(),
            updated_at:   optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'work_email'   => $this->work_email,
            'organisation' => $this->organisation,
            'message'      => $this->message,
            'enquiry_type' => $this->enquiry_type,
            'status'       => $this->status,
            'created_at'   => $this->created_at,
            'updated_at'   => $this->updated_at,
        ];
    }
}
