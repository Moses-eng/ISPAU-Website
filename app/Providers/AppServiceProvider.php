<?php

namespace App\Providers;

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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(app_path('Modules/Contact/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/Application/Migrations'));
        $this->loadMigrationsFrom(app_path('Modules/SystemUser/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/ResearchWork/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/ResearchWork/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/ResearchWork/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/ResearchWork/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/ResearchWork/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/ResearchWork/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/ResearchWork/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/ResearchWork/Migrations'));
        // $this->loadMigrationsFrom(app_path('Modules/ResearchWork/Migrations'));

    }
}
