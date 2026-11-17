<?php

namespace App\Providers;

use App\Modules\AdminNotification\Interfaces\AdminNotificationServiceInterface;
use App\Modules\AdminNotification\Repositories\AdminNotificationRepository;
use App\Modules\AdminNotification\RepositoryInterfaces\AdminNotificationRepositoryInterface;
use App\Modules\AdminNotification\Services\AdminNotificationService;
use App\Modules\ApplicantNotification\Interfaces\ApplicantNotificationServiceInterface;
use App\Modules\ApplicantNotification\Repositories\ApplicantNotificationRepository;
use App\Modules\ApplicantNotification\RepositoryInterfaces\ApplicantNotificationRepositoryInterface;
use App\Modules\ApplicantNotification\Services\ApplicantNotificationService;
use App\Modules\Application\Interfaces\ApplicationServiceInterface;
use App\Modules\Application\Repositories\ApplicationRepository;
use App\Modules\Application\RepositoryInterfaces\ApplicationRepositoryInterface;
use App\Modules\Application\Services\ApplicationAttachmentService;
use App\Modules\Application\Services\ApplicationService;
use App\Modules\Application\Interfaces\ClarificationServiceInterface;
use App\Modules\Application\Repositories\ClarificationRepository;
use App\Modules\Application\RepositoryInterfaces\ClarificationRepositoryInterface;
use App\Modules\Application\Services\ClarificationService;
use App\Modules\Contact\Interfaces\ContactServiceInterface;
use App\Modules\Contact\Repositories\ContactRepository;
use App\Modules\Contact\RepositoryInterfaces\ContactRepositoryInterface;
use App\Modules\Contact\Services\ContactService;
use App\Modules\Application\Interfaces\ReviewerServiceInterface;
use App\Modules\Application\Repositories\ReviewerRepository;
use App\Modules\Application\RepositoryInterfaces\ReviewerRepositoryInterface;
use App\Modules\Application\Services\ReviewerService;
use App\Modules\SystemUser\Interfaces\SystemUserServiceInterface;
use App\Modules\SystemUser\Repositories\SystemUserRepository;
use App\Modules\SystemUser\RepositoryInterfaces\SystemUserRepositoryInterface;
use App\Modules\SystemUser\Services\SystemUserService;
use App\Modules\Application\Interfaces\VerificationServiceInterface;
use App\Modules\Application\RepositoryInterfaces\VerificationRepositoryInterface;
use App\Modules\Application\Services\VerificationService;
use App\Modules\Application\Repositories\VerificationRepository;
use App\Modules\Banner\Interfaces\BannerServiceInterface;
use App\Modules\Banner\Repositories\BannerRepository;
use App\Modules\Banner\RepositoryInterfaces\BannerRepositoryInterface;
use App\Modules\Banner\Services\BannerAttachmentService;
use App\Modules\Banner\Services\BannerService;
use App\Modules\FinanceAdminNotification\Interfaces\FinanceAdminNotificationServiceInterface;
use App\Modules\FinanceAdminNotification\Repositories\FinanceAdminNotificationRepository;
use App\Modules\FinanceAdminNotification\RepositoryInterfaces\FinanceAdminNotificationRepositoryInterface;
use App\Modules\FinanceAdminNotification\Services\FinanceAdminNotificationService;
use App\Modules\HeroSlide\Interfaces\HeroSlideServiceInterface;
use App\Modules\HeroSlide\Repositories\HeroSlideRepository;
use App\Modules\HeroSlide\RepositoryInterfaces\HeroSlideRepositoryInterface;
use App\Modules\HeroSlide\Services\HeroSlideAttachmentService;
use App\Modules\HeroSlide\Services\HeroSlideService;
use App\Modules\MembershipAdminNotification\Interfaces\MembershipAdminNotificationServiceInterface;
use App\Modules\MembershipAdminNotification\Repositories\MembershipAdminNotificationRepository;
use App\Modules\MembershipAdminNotification\RepositoryInterfaces\MembershipAdminNotificationRepositoryInterface;
use App\Modules\MembershipAdminNotification\Services\MembershipAdminNotificationService;
use App\Modules\OperationsOfficerNotification\Interfaces\OperationsOfficerNotificationServiceInterface;
use App\Modules\OperationsOfficerNotification\Repositories\OperationsOfficerNotificationRepository;
use App\Modules\OperationsOfficerNotification\RepositoryInterfaces\OperationsOfficerNotificationRepositoryInterface;
use App\Modules\OperationsOfficerNotification\Services\OperationsOfficerNotificationService;
use App\Modules\Tier\Interfaces\TierServiceInterface;
use App\Modules\Tier\RepositoryInterfaces\TierRepositoryInterface;
use App\Modules\Tier\Repositories\TierRepository;

use App\Modules\Tier\Services\TierService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Contact
        $this->app->bind(ContactRepositoryInterface::class, ContactRepository::class);
        $this->app->bind(ContactServiceInterface::class, ContactService::class);

        // Application
        $this->app->bind(ApplicationRepositoryInterface::class, ApplicationRepository::class);
        $this->app->bind(ApplicationServiceInterface::class, ApplicationService::class);
        $this->app->singleton(ApplicationAttachmentService::class);

        // System users
        $this->app->bind(SystemUserRepositoryInterface::class, SystemUserRepository::class);
        $this->app->bind(SystemUserServiceInterface::class,    SystemUserService::class);

        // … Clarification bindings …
        $this->app->bind(ClarificationRepositoryInterface::class, ClarificationRepository::class);
        $this->app->bind(ClarificationServiceInterface::class, ClarificationService::class);

    // … Reviewer bindings …
        $this->app->bind(ReviewerRepositoryInterface::class, ReviewerRepository::class);
        $this->app->bind(ReviewerServiceInterface::class, ReviewerService::class);

        // … Verification bindings …
        $this->app->bind(VerificationRepositoryInterface::class, VerificationRepository::class);
        $this->app->bind(VerificationServiceInterface::class, VerificationService::class);

        // … Tire bindings …
        $this->app->bind(TierRepositoryInterface::class, TierRepository::class);
        $this->app->bind(TierServiceInterface::class, TierService::class);

        // … HeroSlide bindings …
        $this->app->bind(HeroSlideRepositoryInterface::class, HeroSlideRepository::class);
        $this->app->singleton(HeroSlideAttachmentService::class);
        $this->app->bind(HeroSlideServiceInterface::class, HeroSlideService::class);

        // … Banner bindings …
        $this->app->bind(BannerRepositoryInterface::class, BannerRepository::class);
        $this->app->singleton(BannerAttachmentService::class);
        $this->app->bind(BannerServiceInterface::class, BannerService::class);

        // … ApplicantNotification bindings …
        $this->app->bind(ApplicantNotificationRepositoryInterface::class, ApplicantNotificationRepository::class);
        $this->app->bind(ApplicantNotificationServiceInterface::class, ApplicantNotificationService::class);

        // … AdminNotification bindings …
        $this->app->bind(AdminNotificationRepositoryInterface::class, AdminNotificationRepository::class);
        $this->app->bind(AdminNotificationServiceInterface::class, AdminNotificationService::class);

        // … FinanceAdminNotification bindings …
        $this->app->bind(FinanceAdminNotificationRepositoryInterface::class, FinanceAdminNotificationRepository::class);
        $this->app->bind(FinanceAdminNotificationServiceInterface::class, FinanceAdminNotificationService::class);

        // … MembershipAdminNotification bindings …
        $this->app->bind(MembershipAdminNotificationRepositoryInterface::class, MembershipAdminNotificationRepository::class);
        $this->app->bind(MembershipAdminNotificationServiceInterface::class, MembershipAdminNotificationService::class);

        // … OperationsOfficerNotification bindings …
        $this->app->bind(OperationsOfficerNotificationRepositoryInterface::class, OperationsOfficerNotificationRepository::class);
        $this->app->bind(OperationsOfficerNotificationServiceInterface::class, OperationsOfficerNotificationService::class);

        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …
        // … Banner bindings …

    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(app_path('Modules/Contact/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/Application/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/SystemUser/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/Tier/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/HeroSlide/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/Banner/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/ApplicantNotification/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/FinanceAdminNotification/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/MembershipAdminNotification/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/OperationsOfficerNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/AdminNotification/Migrations'));



    }
}
