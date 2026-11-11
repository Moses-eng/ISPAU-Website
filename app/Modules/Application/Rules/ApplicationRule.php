<?php

namespace App\Modules\Application\Rules;

use Illuminate\Validation\Rule;

class ApplicationRule
{
    public const STATUS_OPTIONS = [
        'Draft',
        'Submitted',
        'Under review',
        'Clarification needed',
        'Decision pending',
        'Approved awaiting payment',
        'Active',
        'Deferred',
        'Declined',
    ];

    public static function createRules(): array
    {
        return [
            // Organisation identity
            'legalName'             => 'required|string|max:255',
            'tradingName'           => 'sometimes|nullable|string|max:255',
            'entityType'            => 'required|string|max:255',
            'registrationCountry'   => 'required|string|max:255',
            'registrationReference' => 'required|string|max:255',
            'businessEmail' => 'required|email|max:255|unique:applications,business_email',
            'businessPhone'         => 'required|string|max:30',
            'website'               => 'sometimes|nullable|string|max:255',
            'registeredAddress'     => 'required|string',
            'ugandaAddress'         => 'required|string',

            // Account Password
            'password'              => 'required',
            'password_confirmation' => 'required',

            // Profile
            'category'              => 'required|string|max:255',
            'operationalStatus'     => 'required|string|max:255',
            'requestedTier'         => 'required|string|max:255',
            'customerFacing'        => 'sometimes|string|in:Yes,No',

            // Compliance
            'pdpoStatus'            => 'required|string|max:255',
            'licenceRelevant'       => 'required|string|max:255',

            // Applicant / representative
            'applicantName'         => 'required|string|max:255',
            'applicantRole'         => 'required|string|max:255',
            'applicantEmail'        => 'required|email|max:255',
            'applicantPhone'        => 'required|string|max:30',
            'representativeName'    => 'required|string|max:255',
            'representativeRole'    => 'required|string|max:255',
            'representativeEmail'   => 'required|email|max:255',
            'representativePhone'   => 'required|string|max:30',

            // Billing
            'billingEmail'          => 'required|email|max:255',
            'billingContact'        => 'required|string|max:255',
            'invoiceAddress'        => 'required|string',

            // Declarations
            'accuracyDeclaration'      => 'accepted',
            'authorityDeclaration'     => 'accepted',
            'rulesDeclaration'         => 'accepted',
            'restrictionsDeclaration'  => 'accepted',
            'privacyDeclaration'       => 'accepted',

            // Uploads
            'uploads'                  => 'sometimes|array',
            'uploads.*'                => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',

            'status'                   => ['sometimes', Rule::in(self::STATUS_OPTIONS)],
        ];
    }

    public static function draftRules(): array
    {
        return [
            'id'                    => 'sometimes|nullable|uuid',
            // 'password'              => 'sometimes|nullable|string|min:8',
            'legalName'             => 'sometimes|nullable|string|max:255',
            'tradingName'           => 'sometimes|nullable|string|max:255',
            'entityType'            => 'sometimes|nullable|string|max:255',
            'registrationCountry'   => 'sometimes|nullable|string|max:255',
            'registrationReference' => 'sometimes|nullable|string|max:255',
            'businessPhone'         => 'sometimes|nullable|string|max:30',
            'website'               => 'sometimes|nullable|string|max:255',
            'registeredAddress'     => 'sometimes|nullable|string',
            'ugandaAddress'         => 'sometimes|nullable|string',
            'category'              => 'sometimes|nullable|string|max:255',
            'operationalStatus'     => 'sometimes|nullable|string|max:255',
            'requestedTier'         => 'sometimes|nullable|string|max:255',
            'customerFacing'        => 'sometimes|nullable|string|in:Yes,No',
            'pdpoStatus'            => 'sometimes|nullable|string|max:255',
            'licenceRelevant'       => 'sometimes|nullable|string|max:255',
            'applicantName'         => 'sometimes|nullable|string|max:255',
            'applicantRole'         => 'sometimes|nullable|string|max:255',
            'applicantEmail'        => 'sometimes|nullable|email|max:255',
            'applicantPhone'        => 'sometimes|nullable|string|max:30',
            'representativeName'    => 'sometimes|nullable|string|max:255',
            'representativeRole'    => 'sometimes|nullable|string|max:255',
            'representativeEmail'   => 'sometimes|nullable|email|max:255',
            'representativePhone'   => 'sometimes|nullable|string|max:30',
            'billingEmail'          => 'sometimes|nullable|email|max:255',
            'billingContact'        => 'sometimes|nullable|string|max:255',
            'invoiceAddress'        => 'sometimes|nullable|string',
            'uploads'               => 'sometimes|array',
            'uploads.*'             => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'businessEmail' => [ 'required', 'email', 'max:255', Rule::unique('applications', 'business_email'),
            ],
        ];
    }

    public static function updateRules(string $applicationId): array
    {
        return [
            // 'password'              => 'sometimes|nullable|string|min:8',
            'legalName'             => 'sometimes|string|max:255',
            'tradingName'           => 'sometimes|nullable|string|max:255',
            'entityType'            => 'sometimes|string|max:255',
            'registrationCountry'   => 'sometimes|string|max:255',
            'registrationReference' => 'sometimes|string|max:255',
            'businessEmail'         => 'sometimes|email|max:255',
            'businessPhone'         => 'sometimes|string|max:30',
            'website'               => 'sometimes|nullable|string|max:255',
            'registeredAddress'     => 'sometimes|string',
            'ugandaAddress'         => 'sometimes|string',
            'category'              => 'sometimes|string|max:255',
            'operationalStatus'     => 'sometimes|string|max:255',
            'requestedTier'         => 'sometimes|string|max:255',
            'customerFacing'        => 'sometimes|string|in:Yes,No',
            'pdpoStatus'            => 'sometimes|string|max:255',
            'licenceRelevant'       => 'sometimes|string|max:255',
            'applicantName'         => 'sometimes|string|max:255',
            'applicantRole'         => 'sometimes|string|max:255',
            'applicantEmail'        => 'sometimes|email|max:255',
            'applicantPhone'        => 'sometimes|string|max:30',
            'representativeName'    => 'sometimes|string|max:255',
            'representativeRole'    => 'sometimes|string|max:255',
            'representativeEmail'   => 'sometimes|email|max:255',
            'representativePhone'   => 'sometimes|string|max:30',
            'billingEmail'          => 'sometimes|email|max:255',
            'billingContact'        => 'sometimes|string|max:255',
            'invoiceAddress'        => 'sometimes|string',
            'uploads'               => 'sometimes|array',
            'uploads.*'             => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'status'                => ['sometimes', Rule::in(self::STATUS_OPTIONS)],
        ];
    }
}


