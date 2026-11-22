<?php

namespace App\Modules\Statistics\Models;

use Illuminate\Database\Eloquent\Model;

class StatisticsModel extends Model
{
    /** Application statuses excluded from the "applicants" count. */
    public const NON_DRAFT_EXCLUDED_STATUSES = ['Draft'];
}
