<?php

namespace App\Modules\Dispute\DTOs;

use App\Modules\Dispute\Models\DisputeModel;

class DisputeResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $name,
        public readonly string  $email,
        public readonly string  $reason,
        public readonly string  $recordId,
        public readonly string  $status,
        public readonly ?string $created_at = null,
        public readonly ?string $updated_at = null,
    ) {}

    public static function fromModel(DisputeModel $m): self
    {
        return new self(
            id:         $m->id,
            name:       $m->name,
            email:      $m->email,
            reason:     $m->reason,
            recordId:   (string) $m->recordId,
            status:     $m->status,
            created_at: optional($m->created_at)->toIso8601String(),
            updated_at: optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'reason'     => $this->reason,
            'recordId'   => $this->recordId,
            'status'     => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
