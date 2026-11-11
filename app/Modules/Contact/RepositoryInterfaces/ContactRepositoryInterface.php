<?php

namespace App\Modules\Contact\RepositoryInterfaces;

use App\Modules\Contact\Models\ContactModel;
use Illuminate\Database\Eloquent\Collection;

interface ContactRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function findById(string $id): ?ContactModel;
    public function create(array $data): ContactModel;
    public function update(ContactModel $contact, array $data): ContactModel;
    public function delete(ContactModel $contact): bool;
}
