<?php

namespace App\Modules\Banner\DTOs;

use Illuminate\Http\Request;

class BannerRequestData
{
    public function __construct(
        public readonly string  $name,
        public readonly ?string $description,
        public readonly string  $page_name,
        public readonly string  $status = 'active',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name:        $request->input('name'),
            description: $request->input('description'),
            page_name:   strtolower(trim((string) $request->input('page_name'))),
            status:      $request->input('status', 'active'),
        );
    }

    /**
     * Only the text columns — `image` is set separately after upload.
     */
    public function toArray(): array
    {
        return [
            'name'        => $this->name,
            'description' => $this->description,
            'page_name'   => $this->page_name,
            'status'      => $this->status,
        ];
    }
}
