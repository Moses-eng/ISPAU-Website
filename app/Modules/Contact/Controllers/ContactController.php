<?php

namespace App\Modules\Contact\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Contact\DTOs\ContactRequestData;
use App\Modules\Contact\Interfaces\ContactServiceInterface;
use App\Modules\Contact\Models\ContactModel;
use App\Modules\Contact\Rules\ContactRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function __construct(
        private readonly ContactServiceInterface $service,
    ) {}

    // ==================== LIST ====================
    // GET /api/v1/auth/admin/contacts/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== SHOW ====================
    // GET /api/v1/auth/admin/contacts/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }

    // ==================== STORE ====================
    // POST /api/v1/public/contacts/store
    public function store(Request $request): JsonResponse
    {
        $request->validate(ContactRule::createRules());

        $response = $this->service->create(
            ContactRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }

    // ==================== UPDATE ====================
    // POST /api/v1/auth/admin/contacts/update
    // Body must include: updateId
    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $contact = ContactModel::find($request->input('updateId'));
        if (! $contact) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Contact not found.',
                'data'    => ['contact' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(ContactRule::updateRules($contact->id));

        $response = $this->service->update(
            $contact,
            ContactRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== DELETE ====================
    // DELETE /api/v1/auth/admin/contacts/delete
    // Body must include: deleteId
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $contact = ContactModel::find($request->input('deleteId'));
        if (! $contact) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Contact not found.',
                'data'    => ['contact' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($contact);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }
}
