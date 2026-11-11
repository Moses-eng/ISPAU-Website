<?php

namespace App\Modules\ActivityHistory\DTOs;

use App\Modules\ActivityHistory\Models\AuditEventModel;

class ActivityEventResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $session_id,
        public readonly string  $actor_id,
        public readonly string  $actor_name,
        public readonly ?string $actor_kind,
        public readonly array   $roles,
        public readonly string  $occurred_at,
        public readonly string  $kind,
        public readonly string  $area,
        public readonly string  $summary,
        public readonly ?string $section = null,
        public readonly ?string $record_id = null,
        public readonly ?string $organisation = null,
        public readonly ?string $organisation_id = null,
        public readonly ?string $filename = null,
        public readonly ?int    $record_count = null,
        public readonly array   $changed_fields = [],
        public readonly array   $transitions = [],
    ) {}

    public static function fromModel(AuditEventModel $m): self
    {
        return new self(
            id:              $m->id,
            session_id:      $m->session_id,
            actor_id:        $m->actor_id,
            actor_name:      $m->actor_name,
            actor_kind:      $m->actor_kind,
            roles:           $m->roles ?? [],
            occurred_at:     optional($m->occurred_at)->toIso8601String() ?? '',
            kind:            $m->kind,
            area:            $m->area,
            summary:         $m->summary,
            section:         $m->section,
            record_id:       $m->record_id,
            organisation:    $m->organisation,
            organisation_id: $m->organisation_id,
            filename:        $m->filename,
            record_count:    $m->record_count,
            changed_fields:  $m->changed_fields ?? [],
            transitions:     $m->transitions ?? [],
        );
    }

    public function toArray(): array
    {
        return [
            'id'              => $this->id,
            'session_id'      => $this->session_id,
            'actor_id'        => $this->actor_id,
            'actor_name'      => $this->actor_name,
            'actor_kind'      => $this->actor_kind,
            'roles'           => $this->roles,
            'occurred_at'     => $this->occurred_at,
            'kind'            => $this->kind,
            'area'            => $this->area,
            'summary'         => $this->summary,
            'section'         => $this->section,
            'record_id'       => $this->record_id,
            'organisation'    => $this->organisation,
            'organisation_id' => $this->organisation_id,
            'filename'        => $this->filename,
            'record_count'    => $this->record_count,
            'changed_fields'  => $this->changed_fields,
            'transitions'     => $this->transitions,
        ];
    }
}
