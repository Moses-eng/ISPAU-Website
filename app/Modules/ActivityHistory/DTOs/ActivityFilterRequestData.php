<?php

namespace App\Modules\ActivityHistory\DTOs;

use Illuminate\Http\Request;

class ActivityFilterRequestData
{
    public function __construct(
        public readonly string  $query = '',
        public readonly ?string $person = null,
        public readonly ?string $kind = null,
        public readonly ?string $area = null,
        public readonly ?string $from = null,
        public readonly ?string $to = null,
        public readonly string  $sort = 'occurred_at',
        public readonly string  $order = 'desc',
        public readonly int     $perPage = 50,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            query:   (string) $request->input('query', ''),
            person:  $request->input('person'),
            kind:    $request->input('kind'),
            area:    $request->input('area'),
            from:    $request->input('from'),
            to:      $request->input('to'),
            sort:    (string) $request->input('sort', 'occurred_at'),
            order:   (string) $request->input('order', 'desc'),
            perPage: (int)    $request->input('per_page', 50),
        );
    }

    public function toArray(): array
    {
        return [
            'query'    => $this->query,
            'person'   => $this->person,
            'kind'     => $this->kind,
            'area'     => $this->area,
            'from'     => $this->from,
            'to'       => $this->to,
            'sort'     => $this->sort,
            'order'    => $this->order,
            'per_page' => $this->perPage,
        ];
    }
}
