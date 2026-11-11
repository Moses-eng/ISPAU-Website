<?php

namespace App\Modules\SystemUser\Interfaces;

use App\Modules\SystemUser\DTOs\LogInDataRequest;
use App\Modules\SystemUser\DTOs\RegisterSystemUserRequestData;
use App\Modules\SystemUser\DTOs\SystemUserRegistrationResponseData;
use App\Modules\SystemUser\Models\SystemUserModel;

interface SystemUserServiceInterface
{
    public function register(RegisterSystemUserRequestData $data): SystemUserRegistrationResponseData;
    public function listAll(array $filters = []): SystemUserRegistrationResponseData;
    public function login(LogInDataRequest $data): SystemUserRegistrationResponseData;
    public function logout(string $userId): SystemUserRegistrationResponseData;
    public function updatePassword(SystemUserModel $user, array $data): SystemUserRegistrationResponseData;
    public function resetPassword(string $updateId, array $data): SystemUserRegistrationResponseData;
    public function updateProfile(SystemUserModel $user, array $data): SystemUserRegistrationResponseData;
    public function delete(SystemUserModel $user): SystemUserRegistrationResponseData;
}
