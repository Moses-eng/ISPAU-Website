<?php

namespace App\Modules\ActivityHistory\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AuditEventModel extends Model
{
    use HasUuids;

    protected $table = 'audit_events';

    protected $fillable = [
        'session_id', 'actor_id', 'actor_name', 'actor_kind',
        'roles', 'occurred_at', 'kind', 'area', 'summary',
        'section', 'record_id', 'organisation', 'organisation_id',
        'filename', 'record_count', 'changed_fields', 'transitions',
    ];

    protected $casts = [
        'roles'          => 'array',
        'changed_fields' => 'array',
        'transitions'    => 'array',
        'occurred_at'    => 'datetime',
    ];
}
