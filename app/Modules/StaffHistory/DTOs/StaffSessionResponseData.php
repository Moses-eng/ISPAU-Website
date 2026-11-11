<?php

namespace App\Modules\StaffHistory\DTOs;

class StaffSessionResponseData
{
    public function __construct(
        public readonly string  $session_id,
        public readonly string  $actor_id,
        public readonly string  $actor_name,
        public readonly array   $roles,
        public readonly string  $login_at,
        public readonly ?string $logout_at = null,
        public readonly ?string $logout_reason = null,
        public readonly ?string $last_section = null,
        public readonly ?string $last_section_label = null,
        public readonly ?string $last_visit_at = null,
        public readonly int     $event_count = 0,
    ) {}

    public function toArray(): array
    {
        return [
            'session_id'         => $this->session_id,
            'actor_id'           => $this->actor_id,
            'actor_name'         => $this->actor_name,
            'roles'              => $this->roles,
            'login_at'           => $this->login_at,
            'logout_at'          => $this->logout_at,
            'logout_reason'      => $this->logout_reason,
            'last_section'       => $this->last_section,
            'last_section_label' => $this->last_section_label,
            'last_visit_at'      => $this->last_visit_at,
            'event_count'        => $this->event_count,
        ];
    }
}
