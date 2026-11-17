<?php

namespace App\Modules\MembershipAdminNotification\DTOs;

use App\Modules\MembershipAdminNotification\Models\MembershipAdminNotificationModel;

class MembershipAdminNotificationResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $applicant_id,
        public readonly ?string $applicant_name,
        public readonly ?string $applicant_email,
        public readonly string  $title,
        public readonly string  $message,
        public readonly string  $type,
        public readonly bool    $is_read,
        public readonly ?string $read_at,
        public readonly ?string $created_at,
        public readonly ?string $updated_at,
    ) {}

    public static function fromModel(MembershipAdminNotificationModel $m): self
    {
        return new self(
            id:              (string) $m->id,
            applicant_id:    (string) $m->applicant_id,
            applicant_name:  $m->applicant_name,
            applicant_email: $m->applicant_email,
            title:           $m->title,
            message:         $m->message,
            type:            $m->type,
            is_read:         (bool) $m->is_read,
            read_at:         optional($m->read_at)->toIso8601String(),
            created_at:      optional($m->created_at)->toIso8601String(),
            updated_at:      optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'              => $this->id,
            'applicant_id'    => $this->applicant_id,
            'applicant_name'  => $this->applicant_name,
            'applicant_email' => $this->applicant_email,
            'title'           => $this->title,
            'message'         => $this->message,
            'type'            => $this->type,
            'is_read'         => $this->is_read,
            'read_at'         => $this->read_at,
            'created_at'      => $this->created_at,
            'updated_at'      => $this->updated_at,
        ];
    }
}
