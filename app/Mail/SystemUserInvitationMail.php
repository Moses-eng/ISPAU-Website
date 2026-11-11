<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SystemUserInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $name;
    public string $email;
    public string $role;
    public string $loginUrl;
    public ?string $temporaryPassword;
    public string $appName;
    public string $supportEmail;

    public function __construct(
        string $name,
        string $email,
        string $role = 'Administrator',
        ?string $temporaryPassword = null,
        ?string $loginUrl = null
    ) {
        $this->name              = $name;
        $this->email             = $email;
        $this->role              = $role;
        $this->temporaryPassword = $temporaryPassword;
        $this->appName           = config('app.name', 'ISPAU');
        $this->supportEmail      = config('mail.from.address');

        // In local development, Vite SPA uses hash routing '#/administration'
        // In production, standard route '/administration' is used
        $frontendUrl = rtrim(config('app.frontend_url'));

        $query = http_build_query([
            'email' => $email,
            'setup' => 'true',
        ]);

        $this->loginUrl = $loginUrl ?? "{$frontendUrl}?{$query}";
    }

    public function build(): self
    {
        return $this->subject('Action Required: Set Up Your ' . $this->appName . ' Administrator Account')
                    ->view('emails.system_user_invitation');
    }
}
