<?php

namespace App\Modules\Statistics\RepositoryInterfaces;

interface StatisticsRepositoryInterface
{
    /** Count invoices in the `invoices` table. Optional $financeId scopes by `confirmed_by`. */
    public function countFinance(?string $financeId = null): int;

    /** Count applications in `applications` whose status is NOT 'Draft'. */
    public function countApplicants(): int;

    /** Reserved "other" bucket — intentionally 0. */
    public function countOther(): int;
}
