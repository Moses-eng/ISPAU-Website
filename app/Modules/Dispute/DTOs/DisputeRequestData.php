<?php

namespace App\Modules\Dispute\DTOs;

use Illuminate\Http\Request;

class DisputeRequestData
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $reason,
        public readonly string $recordId,
        public readonly string $status = 'pending',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name:     $request->input('name'),
            email:    strtolower(trim((string) $request->input('email'))),
            reason:   $request->input('reason'),
            recordId: (string) $request->input('recordId'),
            // default pending; service will force pending on create anyway
            status:   $request->input('status', 'pending'),
        );
    }

    public function toArray(): array
    {
        return [
            'name'     => $this->name,
            'email'    => $this->email,
            'reason'   => $this->reason,
            'recordId' => $this->recordId,
            'status'   => $this->status,
        ];
    }
}
