<?php

namespace App\Modules\Payment\Services;

use Illuminate\Support\Facades\DB;

class PaymentNumberGenerator
{
    /**
     * Atomically increment the sequence and return the formatted payment number.
     *
     * Format: PAY-{YEAR}-{PADDED_SEQUENCE}   e.g. PAY-2025-000042
     *
     * Must be called INSIDE a DB transaction so the row lock is held
     * until the payment insert commits.
     */
    public function next(string $scope = 'default', string $prefix = 'PAY', int $pad = 6): string
    {
        $row = DB::table('payment_sequences')
            ->where('scope', $scope)
            ->lockForUpdate()
            ->first();

        if (! $row) {
            DB::table('payment_sequences')->insert([
                'scope'      => $scope,
                'last_value' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $row = DB::table('payment_sequences')
                ->where('scope', $scope)
                ->lockForUpdate()
                ->first();
        }

        $next = ((int) $row->last_value) + 1;

        DB::table('payment_sequences')
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
