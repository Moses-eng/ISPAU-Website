<?php

namespace App\Modules\HeroSlide\DTOs;

use App\Modules\HeroSlide\Models\HeroSlideModel;

class HeroSlideResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $src,
        public readonly string  $description,
        public readonly string  $caption,
        public readonly ?string $credit,
        public readonly int     $sort_order,
        public readonly string  $status,
        public readonly ?string $created_at = null,
        public readonly ?string $updated_at = null,
    ) {}

    public static function fromModel(HeroSlideModel $m): self
    {
        return new self(
            id:          $m->id,
            src:         $m->src,
            description: $m->description,
            caption:     $m->caption,
            credit:      $m->credit,
            sort_order:  (int) $m->sort_order,
            status:      $m->status,
            created_at:  optional($m->created_at)->toIso8601String(),
            updated_at:  optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'src'         => $this->src,
            'description' => $this->description,
            'caption'     => $this->caption,
            'credit'      => $this->credit,
            'sort_order'  => $this->sort_order,
            'status'      => $this->status,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
