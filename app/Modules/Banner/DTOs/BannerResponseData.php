<?php

namespace App\Modules\Banner\DTOs;

use App\Modules\Banner\Models\BannerModel;

class BannerResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $image,
        public readonly string  $name,
        public readonly ?string $description,
        public readonly string  $page_name,
        public readonly string  $status,
        public readonly ?string $created_at = null,
        public readonly ?string $updated_at = null,
    ) {}

    public static function fromModel(BannerModel $m): self
    {
        return new self(
            id:          $m->id,
            image:       $m->image,
            name:        $m->name,
            description: $m->description,
            page_name:   $m->page_name,
            status:      $m->status,
            created_at:  optional($m->created_at)->toIso8601String(),
            updated_at:  optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'image'       => $this->image,
            'name'        => $this->name,
            'description' => $this->description,
            'page_name'   => $this->page_name,
            'status'      => $this->status,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
