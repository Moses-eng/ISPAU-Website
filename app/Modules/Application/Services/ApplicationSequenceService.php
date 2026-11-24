<?php

namespace App\Modules\Application\Services;

use Illuminate\Support\Facades\DB;

class ApplicationSequenceService
{
    /**
     * Generate the next application number, e.g. "APP-2026-001".
     *
     * Uses its own `application_sequences` table (mirrors `invoice_sequences`).
     * The scope is the current year, so numbering restarts every year.
     */
    public function next(): string
    {
        $year  = (string) now()->year;
        $table = 'application_sequences';

        return DB::transaction(function () use ($table, $year) {
            // Ensure a row exists for this year (first submission of the year)
            DB::table($table)->insertOrIgnore([
                'scope'      => $year,
                'last_value' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Lock the row so concurrent submissions serialise
            $row = DB::table($table)
                ->where('scope', $year)
                ->lockForUpdate()
                ->first();

            $next = ((int) $row->last_value) + 1;

            DB::table($table)
                ->where('scope', $year)
                ->update([
                    'last_value' => $next,
                    'updated_at' => now(),
                ]);

            return sprintf('APP-%s-%03d', $year, $next);
        });
    }
}
