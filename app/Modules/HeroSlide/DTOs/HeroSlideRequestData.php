<?php

namespace App\Modules\HeroSlide\DTOs;

use Illuminate\Http\Request;

class HeroSlideRequestData
{
    public function __construct(
        public readonly string  $description,
        public readonly string  $caption,
        public readonly ?string $credit,
        public readonly int     $sort_order = 0,
        public readonly string  $status = 'active',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            description: $request->input('description'),
            caption:     $request->input('caption'),
            credit:      $request->input('credit'),
            sort_order:  (int) $request->input('sort_order', 0),
            status:      $request->input('status', 'active'),
        );
    }

    /**
     * Only the text columns — the `src` is written separately after the
     * image has been uploaded and a stable path is known.
     */
    public function toArray(): array
    {
        return [
            'description' => $this->description,
            'caption'     => $this->caption,
            'credit'      => $this->credit,
            'sort_order'  => $this->sort_order,
            'status'      => $this->status,
        ];
    }
}
