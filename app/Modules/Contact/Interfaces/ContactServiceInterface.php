<?php

namespace App\Modules\Contact\Interfaces;

use App\Modules\Contact\DTOs\ContactActionResponseData;
use App\Modules\Contact\DTOs\ContactRequestData;
use App\Modules\Contact\Models\ContactModel;

interface ContactServiceInterface
{
    public function listAll(array $filters = []): ContactActionResponseData;
    public function show(string $id): ContactActionResponseData;
    public function create(ContactRequestData $data): ContactActionResponseData;
    public function update(ContactModel $contact, ContactRequestData $data): ContactActionResponseData;
    public function delete(ContactModel $contact): ContactActionResponseData;
}
