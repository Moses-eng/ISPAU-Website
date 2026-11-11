<?php

namespace App\Modules\SystemUser\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\SystemUser\DTOs\LogInDataRequest;
use App\Modules\SystemUser\DTOs\RegisterSystemUserRequestData;
use App\Modules\SystemUser\DTOs\SystemUserResponseData;
use App\Modules\SystemUser\Interfaces\SystemUserServiceInterface;
use App\Modules\SystemUser\Models\SystemUserModel;
use App\Modules\SystemUser\Rules\SystemUserRegistrationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemUserController extends Controller
{
    public function __construct(
        private readonly SystemUserServiceInterface $service,
    ) {}

    public function register(Request $request): JsonResponse
    {
        $request->validate(SystemUserRegistrationRule::rules());

        $dto = RegisterSystemUserRequestData::fromRequest($request);
        $res = $this->service->register($dto);

        return response()->json($res->toArray(), $res->isSuccess() ? 201 : 422);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate(SystemUserRegistrationRule::loginRules());

        $dto = LogInDataRequest::fromRequest($request);
        $res = $this->service->login($dto);

        return response()->json($res->toArray(), $res->isSuccess() ? 200 : 401);
    }

    public function logout(): JsonResponse
    {
        /** @var SystemUserModel $user */
        $user = auth('system_users')->user();
        $res  = $this->service->logout($user->id);

        return response()->json($res->toArray());
    }

    public function profile(): JsonResponse
    {
        /** @var SystemUserModel $user */
        $user = auth('system_users')->user();

        return response()->json([
            'status'  => 'success',
            'message' => 'Profile fetched successfully.',
            'data'    => [
                'user'  => SystemUserResponseData::fromModel($user)->toArray(),
                'token' => null,
            ],
            'errors'  => [],
        ]);
    }

    public function listAll(Request $request): JsonResponse
    {
        $res = $this->service->listAll(
            $request->only(['search', 'role', 'is_active', 'sort', 'order'])
        );

        return response()->json($res->toArray());
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var SystemUserModel $user */
        $user = auth('system_users')->user();

        $data = $request->validate(
            SystemUserRegistrationRule::updateRules($user->id)
        );

        $res = $this->service->updateProfile($user, $data);

        return response()->json($res->toArray(), $res->isSuccess() ? 200 : 422);
    }

    public function delete(string $id): JsonResponse
    {
        $user = SystemUserModel::findOrFail($id);
        $res  = $this->service->delete($user);

        return response()->json($res->toArray());
    }
    public function updatePassword(Request $request): JsonResponse
    {
        /** @var SystemUserModel $user */
        $user = auth('system_users')->user();

        $data = $request->validate(
            SystemUserRegistrationRule::updatePasswordRules()
        );

        $res = $this->service->updatePassword($user, $data);

        return response()->json($res->toArray(), $res->isSuccess() ? 200 : 422);
    }
    public function resetPassword(Request $request): JsonResponse
    {
         /** @var SystemUserModel $user */
        $user = auth('system_users')->user();

        $data = $request->validate(
            SystemUserRegistrationRule::resetPasswordRules()
        );

        $res = $this->service->resetPassword($data['updateId'], $data);

        return response()->json($res->toArray(), $res->isSuccess() ? 200 : 422);
    }
}
