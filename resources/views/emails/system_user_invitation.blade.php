{{-- resources/views/emails/system_user_invitation.blade.php --}}
@extends('emails.layouts.ispau')

@section('title', 'Set Up Your Administrator Account | ISPAU')
@section('eyebrow', 'ISPAU Administration')
@section('header-title', 'Welcome to the Administrator Workspace')
@section('header-subtitle', 'Your administrator profile has been created. Set up your private password to get started.')

@section('content')
    <p class="greeting">Hello {{ $name }},</p>

    <p class="intro">
        You have been granted access to the <strong>ISPAU Administrator Workspace</strong>.
        Before accessing your dashboard, you must verify your identity and configure your personal private password.
    </p>

    <div class="info-card">
        <div class="info-card-header">Account Credentials & Access</div>
        <div class="info-row">
            <span class="info-label">Administrator Name</span>&nbsp;&nbsp;&nbsp;
            <span class="info-value">{{ $name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Work Email</span>&nbsp;&nbsp;&nbsp;
            <span class="info-value">{{ $email }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Assigned Role</span>&nbsp;&nbsp;&nbsp;
            <span class="info-value">{{ ucfirst(str_replace('_', ' ', $role)) }}</span>
        </div>
        @if(!empty($temporaryPassword))
        <div class="info-row">
            <span class="info-label">Temporary Password</span>&nbsp;&nbsp;&nbsp;
            <span class="info-value" style="font-family: monospace; color: #650B23;">{{ $temporaryPassword }}</span>
        </div>
        @endif
    </div>

    <div class="highlight-box">
        <div class="highlight-box-title">Next Steps to Access Dashboard</div>
        <ol>
            <li>Click the <strong>Set Up Password & Login</strong> button below.</li>
            <li>Enter your temporary credentials or request your 6-digit email verification code.</li>
            <li>Choose a strong, memorable private password of at least 15 characters.</li>
        </ol>
    </div>

    <div class="cta-wrap">
        <a href="{{ $loginUrl }}" class="cta-button" target="_blank" rel="noopener">
            Set Up Password & Login →
        </a>
    </div>

    <p class="workspace-notice">
        <strong>Security Notice:</strong> ISPAU administrators will never ask for your private password.
        If you did not expect this invitation, please contact your Super Admin immediately at
        <a href="mailto:{{ $supportEmail }}" style="color: #650B23; font-weight: bold;">{{ $supportEmail }}</a>.
    </p>
@endsection
