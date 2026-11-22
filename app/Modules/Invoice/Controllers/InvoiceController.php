<?php

namespace App\Modules\Invoice\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\DTOs\InvoiceRequestData;
use App\Modules\Invoice\Interfaces\InvoiceServiceInterface;
use App\Modules\Invoice\Models\InvoiceModel;
use App\Modules\Invoice\Rules\InvoiceRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly InvoiceServiceInterface $service,
    ) {}

    // ==================== LIST ====================
    // GET /api/v1/auth/admin/invoices/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== SHOW ====================
    // GET /api/v1/auth/admin/invoices/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }

    // ==================== STORE ====================
    // POST /api/v1/auth/admin/invoices/store   (multipart/form-data — finance admin upload)
    public function store(Request $request): JsonResponse
    {
        $request->validate(InvoiceRule::createRules());

        $response = $this->service->create(
            InvoiceRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }

    // ==================== UPDATE ====================
    // POST /api/v1/auth/admin/invoices/update   (multipart/form-data)
    // Body must include: updateId
    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $invoice = InvoiceModel::find($request->input('updateId'));
        if (! $invoice) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Invoice not found.',
                'data'    => ['invoice' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(InvoiceRule::updateRules($invoice->id));

        $response = $this->service->update(
            $invoice,
            InvoiceRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== DELETE ====================
    // DELETE /api/v1/auth/admin/invoices/delete
    // Body must include: deleteId
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $invoice = InvoiceModel::find($request->input('deleteId'));
        if (! $invoice) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Invoice not found.',
                'data'    => ['invoice' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($invoice);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }
}
