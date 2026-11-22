<?php

namespace App\Modules\Receipt\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Receipt\DTOs\ReceiptRequestData;
use App\Modules\Receipt\Interfaces\ReceiptServiceInterface;
use App\Modules\Receipt\Models\ReceiptModel;
use App\Modules\Receipt\Rules\ReceiptRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    public function __construct(
        private readonly ReceiptServiceInterface $service,
    ) {}

    // ==================== LIST ====================
    // GET /api/v1/auth/admin/receipts/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== SHOW ====================
    // GET /api/v1/auth/admin/receipts/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }

    // ==================== STORE (admin) ====================
    // POST /api/v1/auth/admin/receipts/store  (multipart/form-data)
    public function store(Request $request): JsonResponse
    {
        $request->validate(ReceiptRule::createRules());

        $response = $this->service->create(
            ReceiptRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }

    // ==================== UPDATE ====================
    // POST /api/v1/auth/admin/receipts/update  (multipart/form-data)
    // Body must include: updateId  (which is the receipt_id)
    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $receipt = ReceiptModel::find($request->input('updateId'));
        if (! $receipt) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Receipt not found.',
                'data'    => ['receipt' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(ReceiptRule::updateRules($receipt->receipt_id));

        $response = $this->service->update(
            $receipt,
            ReceiptRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== DELETE ====================
    // DELETE /api/v1/auth/admin/receipts/delete
    // Body must include: deleteId  (which is the receipt_id)
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $receipt = ReceiptModel::find($request->input('deleteId'));
        if (! $receipt) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Receipt not found.',
                'data'    => ['receipt' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($receipt);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== APPLICANT UPLOAD ====================
    // POST /api/v1/auth/applicant/receipts/upload  (multipart/form-data)
    // Body: invoice_id (required), receipt_pdf (required)
    // `applicant_id` is derived from the authenticated applicant — never from the body.
    public function uploadReceipt(Request $request): JsonResponse
    {
        $request->validate(ReceiptRule::uploadRules());

        $applicantId = $request->applicant_id;

        $response = $this->service->uploadReceipt(
            $request->input('invoice_id'),
            $applicantId,
            ReceiptRequestData::fromRequest($request),
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }
}
