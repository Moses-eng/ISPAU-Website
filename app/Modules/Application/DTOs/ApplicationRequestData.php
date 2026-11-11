<?php

namespace App\Modules\Application\DTOs;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

class ApplicationRequestData
{
    /** @param array<string, UploadedFile> $uploads */
    public function __construct(
        public readonly ?string  $id = null,
        public readonly ?string  $legalName = null,
        public readonly ?string  $tradingName = null,
        public readonly ?string  $entityType = null,
        public readonly string   $registrationCountry = 'Uganda',
        public readonly ?string  $registrationReference = null,
        public readonly string   $businessEmail = '',
        public readonly ?string  $businessPhone = null,
        public readonly ?string  $website = null,
        public readonly ?string  $password = null,
        public readonly ?string  $registeredAddress = null,
        public readonly ?string  $ugandaAddress = null,

        public readonly ?string  $category = null,
        public readonly ?string  $operationalStatus = null,
        public readonly ?string  $requestedTier = null,
        public readonly string   $customerFacing = 'No',

        public readonly ?string  $pdpoStatus = null,
        public readonly ?string  $licenceRelevant = null,

        public readonly ?string  $applicantName = null,
        public readonly ?string  $applicantRole = null,
        public readonly ?string  $applicantEmail = null,
        public readonly ?string  $applicantPhone = null,
        public readonly ?string  $representativeName = null,
        public readonly ?string  $representativeRole = null,
        public readonly ?string  $representativeEmail = null,
        public readonly ?string  $representativePhone = null,

        public readonly ?string  $billingEmail = null,
        public readonly ?string  $billingContact = null,
        public readonly ?string  $invoiceAddress = null,

        public readonly array    $organisationDetails = [],
        public readonly array    $complianceDetails = [],
        public readonly array    $applicantDetails = [],
        public readonly array    $billingDetails = [],
        public readonly array    $profileOptional = [],
        public readonly array    $restrictions = [],
        public readonly array    $declarations = [],

        public readonly array    $uploads = [],
        public readonly string   $status = 'Submitted',
    ) {}

    public static function fromRequest(Request $request, string $forcedStatus = 'Submitted'): self
    {
        $files = [];
        foreach ((array) $request->file('uploads', []) as $key => $file) {
            if ($file instanceof UploadedFile) {
                $files[$key] = $file;
            }
        }

        return new self(
            id:                    $request->input('id'),
            legalName:             $request->input('legalName'),
            tradingName:           $request->input('tradingName'),
            entityType:            $request->input('entityType'),
            registrationCountry:   (string) $request->input('registrationCountry', 'Uganda'),
            registrationReference: $request->input('registrationReference'),
            businessEmail:         strtolower(trim((string) $request->input('businessEmail'))),
            businessPhone:         $request->input('businessPhone'),
            website:               $request->input('website'),
            password:              $request->filled('password') ? (string) $request->input('password') : null,
            registeredAddress:     $request->input('registeredAddress'),
            ugandaAddress:         $request->input('ugandaAddress'),

            category:              $request->input('category'),
            operationalStatus:     $request->input('operationalStatus'),
            requestedTier:         $request->input('requestedTier'),
            customerFacing:        (string) $request->input('customerFacing', 'No'),

            pdpoStatus:            $request->input('pdpoStatus'),
            licenceRelevant:       $request->input('licenceRelevant'),

            applicantName:         $request->input('applicantName'),
            applicantRole:         $request->input('applicantRole'),
            applicantEmail:        $request->filled('applicantEmail') ? strtolower(trim((string) $request->input('applicantEmail'))) : null,
            applicantPhone:        $request->input('applicantPhone'),
            representativeName:    $request->input('representativeName'),
            representativeRole:    $request->input('representativeRole'),
            representativeEmail:   $request->filled('representativeEmail') ? strtolower(trim((string) $request->input('representativeEmail'))) : null,
            representativePhone:   $request->input('representativePhone'),

            billingEmail:          $request->filled('billingEmail') ? strtolower(trim((string) $request->input('billingEmail'))) : null,
            billingContact:        $request->input('billingContact'),
            invoiceAddress:        $request->input('invoiceAddress'),

            organisationDetails: [
                'services'     => $request->input('services'),
                'regions'      => $request->input('regions'),
                'parent_group' => $request->input('parentGroup'),
            ],
            complianceDetails: [
                'pdpo_reference'     => $request->input('pdpoReference'),
                'pdpo_validity'      => $request->input('pdpoValidity'),
                'pdpo_explanation'   => $request->input('pdpoExplanation'),
                'licence_type'       => $request->input('licenceType'),
                'licence_status'     => $request->input('licenceStatus'),
                'licence_number'     => $request->input('licenceNumber'),
                'licence_holder'     => $request->input('licenceHolder'),
                'licence_validity'   => $request->input('licenceValidity'),
                'licence_type_2'     => $request->input('licenceType2'),
                'licence_status_2'   => $request->input('licenceStatus2'),
                'licence_number_2'   => $request->input('licenceNumber2'),
                'licence_holder_2'   => $request->input('licenceHolder2'),
            ],
            applicantDetails: [
                'alternate_representative' => $request->input('alternateRepresentative'),
                'same_representative'      => filter_var($request->input('sameRepresentative', false), FILTER_VALIDATE_BOOLEAN),
                'authority_confirmed'      => filter_var($request->input('authorityConfirmed', false), FILTER_VALIDATE_BOOLEAN),
            ],
            billingDetails: [
                'tin'            => $request->input('tin'),
                'purchase_order' => $request->input('purchaseOrder'),
                'support_contact'=> $request->input('supportContact'),
            ],
            profileOptional: [
                'joining_reasons'  => $request->input('joiningReasons'),
                'priorities'       => $request->input('priorities'),
                'working_groups'   => $request->input('workingGroups'),
                'public_name'      => $request->input('publicName'),
                'public_description' => $request->input('publicDescription'),
                'public_services'  => $request->input('publicServices'),
                'public_coverage'  => $request->input('publicCoverage'),
                'public_website'   => $request->input('publicWebsite'),
                'public_contact'   => $request->input('publicContact'),
            ],
            restrictions: [
                'has_restrictions'    => $request->input('hasRestrictions', 'No'),
                'restriction_details' => $request->input('restrictionDetails'),
            ],
            declarations: [
                'accuracy'      => filter_var($request->input('accuracyDeclaration', false), FILTER_VALIDATE_BOOLEAN),
                'authority'     => filter_var($request->input('authorityDeclaration', false), FILTER_VALIDATE_BOOLEAN),
                'rules'         => filter_var($request->input('rulesDeclaration', false), FILTER_VALIDATE_BOOLEAN),
                'restrictions'  => filter_var($request->input('restrictionsDeclaration', false), FILTER_VALIDATE_BOOLEAN),
                'privacy'       => filter_var($request->input('privacyDeclaration', false), FILTER_VALIDATE_BOOLEAN),
                'directory'     => filter_var($request->input('directoryConsent', false), FILTER_VALIDATE_BOOLEAN),
                'promotional'   => filter_var($request->input('promotionalConsent', false), FILTER_VALIDATE_BOOLEAN),
            ],
            uploads:  $files,
            status:   (string) $request->input('status', $forcedStatus),
        );
    }

    public function toArray(): array
    {
        $data = [
            'legal_name'             => $this->legalName,
            'trading_name'           => $this->tradingName,
            'entity_type'            => $this->entityType,
            'registration_country'   => $this->registrationCountry,
            'registration_reference' => $this->registrationReference,
            'business_email'         => $this->businessEmail,
            'business_phone'         => $this->businessPhone,
            'website'                => $this->website,
            'registered_address'     => $this->registeredAddress,
            'uganda_address'         => $this->ugandaAddress,
            'category'               => $this->category,
            'operational_status'     => $this->operationalStatus,
            'requested_tier'         => $this->requestedTier,
            'customer_facing'        => $this->customerFacing,
            'pdpo_status'            => $this->pdpoStatus,
            'licence_relevant'       => $this->licenceRelevant,
            'applicant_name'         => $this->applicantName,
            'applicant_role'         => $this->applicantRole,
            'applicant_email'        => $this->applicantEmail,
            'applicant_phone'        => $this->applicantPhone,
            'representative_name'    => $this->representativeName,
            'representative_role'    => $this->representativeRole,
            'representative_email'   => $this->representativeEmail,
            'representative_phone'   => $this->representativePhone,
            'billing_email'          => $this->billingEmail,
            'billing_contact'        => $this->billingContact,
            'invoice_address'        => $this->invoiceAddress,
            'organisation_details'   => $this->organisationDetails,
            'compliance_details'     => $this->complianceDetails,
            'applicant_details'      => $this->applicantDetails,
            'billing_details'        => $this->billingDetails,
            'profile_optional'       => $this->profileOptional,
            'restrictions'           => $this->restrictions,
            'declarations'           => $this->declarations,
            'status'                 => $this->status,
        ];

        if ($this->password !== null) {
            $data['password'] = $this->password;
        }

        return $data;
    }
}
