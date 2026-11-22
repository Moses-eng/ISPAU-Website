<?php

namespace App\Modules\Invoice\Services;

use Illuminate\Support\Facades\DB;

class InvoiceNumberGenerator
{
    /**
     * Atomically increment the sequence and return the formatted invoice number.
     *
     * Format: INV-{YEAR}-{PADDED_SEQUENCE}   e.g. INV-2026-000123
     *
     * Must be called INSIDE a DB transaction so the row lock is held
     * until the invoice insert commits.
     */
    public function next(string $scope = 'default', string $prefix = 'INV', int $pad = 6): string
    {
        // Row-level lock — serialises concurrent callers.
        // SQLite ignores FOR UPDATE but still serialises writes; fine for dev.
        $row = DB::table('invoice_sequences')
            ->where('scope', $scope)
            ->lockForUpdate()
            ->first();

        if (! $row) {
            // First ever call for this scope — create it
            DB::table('invoice_sequences')->insert([
                'scope'      => $scope,
                'last_value' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $row = DB::table('invoice_sequences')
                ->where('scope', $scope)
                ->lockForUpdate()
                ->first();
        }

        $next = ((int) $row->last_value) + 1;

        DB::table('invoice_sequences')
            ->where('scope', $scope)
            ->update([
                'last_value' => $next,
                'updated_at' => now(),
            ]);

        $year   = now()->year;
        $padded = str_pad((string) $next, $pad, '0', STR_PAD_LEFT);

        return "{$prefix}-{$year}-{$padded}";
    }
}
