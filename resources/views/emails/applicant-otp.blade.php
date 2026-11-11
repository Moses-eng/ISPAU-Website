{{-- resources/views/emails/applicant-otp.blade.php --}}
@extends('emails.layouts.ispau')

@section('title', 'Your Verification Code | ' . ($appName ?? 'ISPAU'))
@section('eyebrow', 'Applicant Portal Authentication')
@section('header-title', 'Sign In to Your Application')
@section('header-subtitle', 'Use the single-use verification code below to track and manage your membership application.')

@section('content')
    <p class="greeting">Hello {{ $applicantName }},</p>

    <p class="intro">
        We received a request to access the membership application portal for
        <strong>{{ $organisationName }}</strong>. Enter the one-time verification code below to continue.
    </p>

    <!-- OTP Code Display Card -->
    <div style="background: linear-gradient(145deg, #FAF5F6 0%, #F7F0F2 100%);
                border: 2px dashed #650B23;
                border-radius: 12px;
                padding: 24px 16px;
                text-align: center;
                margin: 24px 0;">
        <span style="font-size: 11px; font-weight: 800; color: #6C5960; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-bottom: 8px;">
            One-Time Verification Code
        </span>
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 36px;
                    font-weight: 800;
                    letter-spacing: 10px;
                    color: #650B23;
                    text-indent: 10px;
                    padding: 6px 0;">
            {{ $code }}
        </div>
        <p style="font-size: 12px; color: #7C2F3C; font-weight: 600; margin-top: 8px;">
            &#9201; Expires in {{ $ttlMinutes }} minutes
        </p>
    </div>

    <!-- Application Summary Card -->
    <div class="info-card">
        <div class="info-card-header">Verification Summary</div>
        <div class="info-row">
            <span class="info-label">Applicant Name</span>&nbsp;&nbsp;&nbsp;
            <span class="info-value">{{ $applicantName }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Organisation</span>&nbsp;&nbsp;&nbsp;
            <span class="info-value">{{ $organisationName }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Code Validity</span>&nbsp;&nbsp;&nbsp;
            <span class="info-value">{{ $ttlMinutes }} minutes</span>
        </div>
    </div>

    <div class="highlight-box">
        <div class="highlight-box-title">Important Security Guidelines</div>
        <ul>
            <li>This code is single-use and will automatically expire in <strong>{{ $ttlMinutes }} minutes</strong>.</li>
            <li>Never share this code with anyone. ISPAU staff will never ask for your verification code.</li>
            <li>If you did not request this login code, you can safely disregard this email.</li>
        </ul>
    </div>

    <p class="workspace-notice">
        Need assistance with your application? Reach out to ISPAU support at
        <a href="mailto:{{ $supportEmail }}" style="color: #650B23; font-weight: bold; text-decoration: none;">{{ $supportEmail }}</a>.
    </p>
@endsection
