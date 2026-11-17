<?php

namespace App\Modules\Application\DTOs;

use App\Modules\Application\Models\ApplicationModel;

class DirectoryResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $name,
        public readonly string  $legalName,
        public readonly string  $description,
        public readonly array   $services,
        public readonly array   $coverage,
        public readonly string  $city,
        public readonly string  $district,
        public readonly ?string $website,
        public readonly ?string $email,
        public readonly ?string $phone,
        public readonly string  $identity,
        public readonly array   $attachments,
    ) {}

    public static function fromModel(ApplicationModel $app): self
    {
        $org     = is_array($app->organisation_details) ? $app->organisation_details : [];
        $profile = is_array($app->profile_optional) ? $app->profile_optional : [];
        $address = is_array($app->uganda_address) ? $app->uganda_address : [];
        $allAttachments = is_array($app->attachments) ? $app->attachments : [];

        // Resolve display name
        $name = !empty($profile['public_name'])
            ? $profile['public_name']
            : ($app->trading_name ?: $app->legal_name);

        // Resolve description
        $description = $profile['public_description']
            ?? $profile['description']
            ?? $org['description']
            ?? 'ISPAU Accredited Member';

        // Resolve services & coverage
        $services = self::normalizeArray($profile['public_services'] ?? $profile['services'] ?? $org['services'] ?? ['Internet Service Provider']);
        $coverage = self::normalizeArray($profile['public_coverage'] ?? $profile['coverage'] ?? $org['regions'] ?? ['Uganda']);

        // Send ONLY the logo in attachments
        $publicLogo = $allAttachments['publicLogo'] ?? $allAttachments['logo'] ?? null;
        $attachments = [
            'publicLogo' => $publicLogo,
        ];

        return new self(
            id:          $app->id,
            name:        $name,
            legalName:   $app->legal_name ?? '',
            description: $description,
            services:    $services,
            coverage:    $coverage,
            city:        is_array($address) ? ($address['city'] ?? 'Kampala') : 'Kampala',
            district:    is_array($address) ? ($address['district'] ?? 'Central') : 'Central',
            website:     $profile['public_website'] ?? $app->website,
            email:       $profile['public_contact'] ?? $app->business_email,
            phone:       $app->business_phone,
            identity:    substr(md5($app->id), 0, 8),
            attachments: $attachments,
        );
    }

    private static function normalizeArray(mixed $val): array
    {
        if (is_array($val)) {
            return array_values(array_filter(array_map('trim', $val)));
        }
        if (is_string($val)) {
            return array_values(array_filter(array_map('trim', preg_split('/[,·|]/', $val))));
        }
        return [];
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'legal_name'  => $this->legalName,
            'description' => $this->description,
            'services'    => $this->services,
            'coverage'    => $this->coverage,
            'city'        => $this->city,
            'district'    => $this->district,
            'website'     => $this->website,
            'email'       => $this->email,
            'phone'       => $this->phone,
            'identity'    => $this->identity,
            'attachments' => $this->attachments,
        ];
    }
}
