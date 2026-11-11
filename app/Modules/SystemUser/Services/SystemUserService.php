<?php

namespace App\Modules\SystemUser\Services;

use App\Mail\SystemUserInvitationMail;
use App\Modules\SystemUser\DTOs\LogInDataRequest;
use App\Modules\SystemUser\DTOs\RegisterSystemUserRequestData;
use App\Modules\SystemUser\DTOs\SystemUserRegistrationResponseData;
use App\Modules\SystemUser\DTOs\SystemUserResponseData;
use App\Modules\SystemUser\Interfaces\SystemUserServiceInterface;
use App\Modules\SystemUser\Models\SystemUserModel;
use App\Modules\SystemUser\RepositoryInterfaces\SystemUserRepositoryInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

class SystemUserService implements SystemUserServiceInterface
{
    private const GUARD = 'system_users';

    public function __construct(
        private readonly SystemUserRepositoryInterface $repository,
    ) {}

    // ==================== LIST ====================

    public function listAll(array $filters = []): SystemUserRegistrationResponseData
    {
        try {
            $users = $this->repository->all($filters);

            $items = $users
                ->map(fn (SystemUserModel $u) => SystemUserResponseData::fromModel($u)->toArray())
                ->values()
                ->all();

            return SystemUserRegistrationResponseData::success(
                message: 'System users fetched successfully.',
                user:    null,
                token:   null,
                payload: ['items' => $items, 'total' => count($items)],
            );
        } catch (\Throwable $e) {
            Log::error('System user list failed', [
                'error'   => $e->getMessage(),
                'filters' => $filters,
            ]);
            return SystemUserRegistrationResponseData::error('Failed to fetch system users.');
        }
    }

    // ==================== REGISTER ====================

    public function register(RegisterSystemUserRequestData $data): SystemUserRegistrationResponseData
    {
        if ($this->repository->emailExists($data->email)) {
            throw ValidationException::withMessages([
                'email' => ['This email is already registered as a System User.'],
            ]);
        }

        try {
            return DB::transaction(function () use ($data) {
                $user = $this->repository->create($data->toArray());

                Log::info('System user registered', ['user_id' => $user->id]);

                // Send setup/password reset invitation email
                // Uses raw password from request if passed, or null
                $rawPassword = $data->password ?? null;
                $this->sendInvitationEmail($user, $rawPassword);

                return SystemUserRegistrationResponseData::success(
                    message: "System user {$user->name} created successfully. An invitation email has been sent.",
                    user:    SystemUserResponseData::fromModel($user),
                    token:   null,
                );
            });
        } catch (\Throwable $e) {
            Log::error('System user registration failed', ['error' => $e->getMessage()]);
            return SystemUserRegistrationResponseData::error(
                'Registration failed: ' . $e->getMessage()
            );
        }
    }

    /**
     * Send password setup/invitation email.
     */
    private function sendInvitationEmail(SystemUserModel $user, ?string $temporaryPassword = null): void
    {
        try {
            Mail::to($user->email)->send(new SystemUserInvitationMail(
                name:              $user->name,
                email:             $user->email,
                role:              $user->role ?? 'Administrator',
                temporaryPassword: $temporaryPassword,
            ));

            Log::info('System user invitation email sent', ['user_id' => $user->id]);
        } catch (\Throwable $e) {
            // Non-fatal: registration already committed
            Log::warning('System user invitation email failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
        }
    }

    // ==================== LOGIN (JWT) ====================

    public function login(LogInDataRequest $data): SystemUserRegistrationResponseData
    {
        $user = $this->repository->findByEmail($data->email);

        if (! $user) {
            return SystemUserRegistrationResponseData::error('Invalid email or password.');
        }

        if (! Hash::check($data->password, $user->password)) {
            return SystemUserRegistrationResponseData::error('Invalid email or password.');
        }

        if (! $user->is_active) {
            return SystemUserRegistrationResponseData::error(
                'This system user account is deactivated.'
            );
        }

        try {
            $token = Auth::guard(self::GUARD)->login($user);
        } catch (JWTException $e) {
            Log::error('System user token issue failed', ['error' => $e->getMessage()]);
            return SystemUserRegistrationResponseData::error('Could not create token.');
        }

        try {
            $this->repository->updateLastLogin($user, request()->ip());
        } catch (\Throwable $e) {
            Log::warning('System user last-login update failed', ['error' => $e->getMessage()]);
        }

        return SystemUserRegistrationResponseData::success(
            message: "Welcome back, {$user->name}.",
            user:    SystemUserResponseData::fromModel($user),
            token:   $token,
        );
    }

    // ==================== LOGOUT (JWT) ====================

    public function logout(string $userId): SystemUserRegistrationResponseData
    {
        $user = $this->repository->findById($userId);
        if (! $user) {
            return SystemUserRegistrationResponseData::error('System user not found.');
        }

        try {
            Auth::guard(self::GUARD)->logout();
        } catch (TokenExpiredException $e) {
            // already expired — treat as success
        } catch (TokenInvalidException $e) {
            return SystemUserRegistrationResponseData::error('Token is invalid.');
        } catch (JWTException $e) {
            return SystemUserRegistrationResponseData::error('Could not invalidate token.');
        }

        return SystemUserRegistrationResponseData::success(
            message: 'Logged out successfully.',
            user:    null,
            token:   null,
        );
    }

    // ==================== PROFILE ====================

    public function updateProfile(SystemUserModel $user, array $data): SystemUserRegistrationResponseData
    {
        $allowed = array_intersect_key($data, array_flip([
            'name', 'email', 'password',
        ]));

        if (empty($allowed)) {
            return SystemUserRegistrationResponseData::error('Nothing to update.');
        }

        try {
            $updated = $this->repository->update($user, $allowed);

            return SystemUserRegistrationResponseData::success(
                message: 'Profile updated successfully.',
                user:    SystemUserResponseData::fromModel($updated),
                token:   null,
            );
        } catch (\Throwable $e) {
            Log::error('System user profile update failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return SystemUserRegistrationResponseData::error('Failed to update profile.');
        }
    }

    // ==================== DELETE ====================

    public function delete(SystemUserModel $user): SystemUserRegistrationResponseData
    {
        try {
            $this->repository->delete($user);

            Log::info('System user deleted', [
                'user_id' => $user->id,
                'email'   => $user->email,
            ]);

            return SystemUserRegistrationResponseData::success(
                message: 'System user deleted successfully.',
                user:    null,
                token:   null,
            );
        } catch (\Throwable $e) {
            Log::error('System user delete failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return SystemUserRegistrationResponseData::error('Failed to delete system user.');
        }
    }
    /**
 * Update the authenticated system user's password.
 * Requires `current_password`, `password`, `password_confirmation`.
 */
    public function updatePassword(SystemUserModel $user, array $data): SystemUserRegistrationResponseData
    {
        // 1. Verify current password
        if (! Hash::check($data['current_password'] ?? '', $user->password)) {
            return SystemUserRegistrationResponseData::error(
                'Current password is incorrect.',
                ['current_password' => ['The current password is incorrect.']],
            );
        }

        // 2. Ensure new password actually differs
        if (Hash::check($data['password'] ?? '', $user->password)) {
            return SystemUserRegistrationResponseData::error(
                'New password must be different from the current password.',
                ['password' => ['The new password must be different from the current one.']],
            );
        }

        try {
            $this->repository->update($user, [
                'password' => $data['password'],
            ]);

            Log::info('System user password updated', ['user_id' => $user->id]);

            return SystemUserRegistrationResponseData::success(
                message: 'Password updated successfully.',
                user:    null,
                token:   null,
            );
        } catch (\Throwable $e) {
            Log::error('System user password update failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return SystemUserRegistrationResponseData::error('Failed to update password.');
        }
    }

    /**
     * Admin-only password reset. The target user is identified by `updateId`.
     * Fails if the id is missing, malformed, or doesn't resolve to a real user.
     */
    public function resetPassword(string $updateId, array $data): SystemUserRegistrationResponseData
    {
        // 1. Guard — required field
        if ($updateId === '') {
            return SystemUserRegistrationResponseData::error(
                'Target user id is required.',
                ['updateId' => ['The updateId field is required.']],
            );
        }

        // 3. Resolve the target user — this is the "check updateId before changing" step
        $user = $this->repository->findById($updateId);
        if (! $user) {
            return SystemUserRegistrationResponseData::error(
                'Target system user not found.',
                ['updateId' => ['No system user exists with the provided id.']],
            );
        }

        // 4. Guard — password field present (rules validate this too)
        if (empty($data['password'])) {
            return SystemUserRegistrationResponseData::error(
                'Password is required.',
                ['password' => ['The password field is required.']],
            );
        }

        // 5. Apply the new password (repository hashes it automatically)
        try {
            $this->repository->update($user, [
                'password' => $data['password'],
            ]);

            Log::info('System user password reset by admin', [
                'user_id'    => $user->id,
                'admin_id'   => optional(auth('system_users')->user())->id,
                'admin_role' => optional(auth('system_users')->user())->role,
            ]);

            return SystemUserRegistrationResponseData::success(
                message: "Password for {$user->name} reset successfully.",
                user:    null,
                token:   null,
            );
        } catch (\Throwable $e) {
            Log::error('System user password reset failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return SystemUserRegistrationResponseData::error('Failed to reset password.');
        }
    }
}
