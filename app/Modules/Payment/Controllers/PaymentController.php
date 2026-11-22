<?php

namespace App\Modules\Payment\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payment\DTOs\PaymentRequestData;
use App\Modules\Payment\Interfaces\PaymentServiceInterface;
use App\Modules\Payment\Models\PaymentModel;
use App\Modules\Payment\Rules\PaymentRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentServiceInterface $service,
    ) {}

    // ==================== LIST ====================
    // GET /api/v1/auth/admin/payments/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== SHOW ====================
    // GET /api/v1/auth/admin/payments/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }

    // ==================== STORE ====================
    // POST /api/v1/auth/admin/payments/store
    public function store(Request $request): JsonResponse
    {
        $request->validate(PaymentRule::createRules());

        $response = $this->service->create(
            PaymentRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }

    // ==================== UPDATE ====================
    // POST /api/v1/auth/admin/payments/update
    // Body must include: updateId  (which is the payment_id)
    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $payment = PaymentModel::find($request->input('updateId'));
        if (! $payment) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Payment not found.',
                'data'    => ['payment' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(PaymentRule::updateRules($payment->payment_id));

        $response = $this->service->update(
            $payment,
            PaymentRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== DELETE ====================
    // DELETE /api/v1/auth/admin/payments/delete
    // Body must include: deleteId  (which is the payment_id)
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $payment = PaymentModel::find($request->input('deleteId'));
        if (! $payment) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Payment not found.',
                'data'    => ['payment' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($payment);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }
}
