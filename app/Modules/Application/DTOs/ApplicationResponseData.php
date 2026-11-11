<?php

namespace App\Modules\Application\DTOs;

use App\Modules\Application\Models\ApplicationModel;

class ApplicationResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly array   $payload,
        public readonly string  $status,
        public readonly ?string $created_at = null,
        public readonly ?string $updated_at = null,
    ) {}

    public static function fromModel(ApplicationModel $m): self
    {
        // Eager-load the related records BEFORE building the payload.
        // loadMissing is a no-op if they're already loaded.
        $m->loadMissing(['reviewers', 'clarifications', 'verifications']);

        return new self(
            id: $m->id,
            payload: [
                'legal_name'             => $m->legal_name,
                'trading_name'           => $m->trading_name,
                'entity_type'            => $m->entity_type,
                'registration_country'   => $m->registration_country,
                'registration_reference' => $m->registration_reference,
                'business_email'         => $m->business_email,
                'business_phone'         => $m->business_phone,
                'website'                => $m->website,
                'registered_address'     => $m->registered_address,
                'uganda_address'         => $m->uganda_address,
                'category'               => $m->category,
                'operational_status'     => $m->operational_status,
                'requested_tier'         => $m->requested_tier,
                'customer_facing'        => $m->customer_facing,
                'pdpo_status'            => $m->pdpo_status,
                'licence_relevant'       => $m->licence_relevant,
                'applicant_name'         => $m->applicant_name,
                'applicant_role'         => $m->applicant_role,
                'applicant_email'        => $m->applicant_email,
                'applicant_phone'        => $m->applicant_phone,
                'representative_name'    => $m->representative_name,
                'representative_role'    => $m->representative_role,
                'representative_email'   => $m->representative_email,
                'representative_phone'   => $m->representative_phone,
                'billing_email'          => $m->billing_email,
                'billing_contact'        => $m->billing_contact,
                'invoice_address'        => $m->invoice_address,
                'organisation_details'   => $m->organisation_details,
                'compliance_details'     => $m->compliance_details,
                'applicant_details'      => $m->applicant_details,
                'billing_details'        => $m->billing_details,
                'profile_optional'       => $m->profile_optional,
                'restrictions'           => $m->restrictions,
                'declarations'           => $m->declarations,
                'attachments'            => $m->attachments,

                // --- Related records ---

                'reviewers' => $m->reviewers->map(fn ($r) => [
                    'id'               => $r->id,
                    'reviewer_id'      => $r->reviewer_id,
                    'reviewer_name'    => $r->reviewer_name,
                    'assigned_by'      => $r->assigned_by,
                    'assigned_by_name' => $r->assigned_by_name,
                    'status'           => $r->status,
                    'assigned_at'      => optional($r->assigned_at)->toIso8601String(),
                    'completed_at'     => optional($r->completed_at)->toIso8601String(),
                ])->all(),

                'clarifications' => $m->clarifications->map(fn ($c) => [
                    'id'            => $c->id,
                    'reviewer_id'   => $c->reviewer_id,
                    'reviewer_name' => $c->reviewer_name,
                    'subject'       => $c->subject,
                    'message'       => $c->message,
                    'items'         => $c->items ?? [],
                    'response'      => $c->response,
                    'responded_at'  => optional($c->responded_at)->toIso8601String(),
                    'status'        => $c->status,
                    'requested_at'  => optional($c->requested_at)->toIso8601String(),
                ])->all(),

                'verifications' => $m->verifications->map(fn ($v) => [
                    'id'            => $v->id,
                    'reviewer_id'   => $v->reviewer_id,
                    'reviewer_name' => $v->reviewer_name,
                    'checks'        => [
                        'registration' => [
                            'result' => $v->registration_result,
                            'note'   => $v->registration_note,
                        ],
                        'authority' => [
                            'result' => $v->authority_result,
                            'note'   => $v->authority_note,
                        ],
                        'regulatory' => [
                            'result' => $v->regulatory_result,
                            'note'   => $v->regulatory_note,
                        ],
                    ],
                    'status'      => $v->status,
                    'recorded_at' => optional($v->recorded_at)->toIso8601String(),
                ])->all(),
            ],
            status:     $m->status,
            created_at: optional($m->created_at)->toIso8601String(),
            updated_at: optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'         => $this->id,
            'status'     => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            ...$this->payload,
        ];
    }
}
