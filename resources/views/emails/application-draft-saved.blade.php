@extends('emails.layouts.ispau')

@section('title', 'Application Draft Saved | ' . ($appName ?? 'ISPAU'))
@section('eyebrow', 'Membership Application')
@section('header-title', 'Draft Saved')
@section('header-subtitle', 'Your application progress has been securely preserved on the ISPAU portal.')

@section('content')
    <p class="greeting">Hello {{ $app->applicant_name ?: 'Applicant' }},</p>

    <p class="intro">
        Your draft application for <strong>{{ $app->legal_name ?: 'Your Organisation' }}</strong> has been safely saved.
        You can return to finish and submit your application at any time.
    </p>

    <div class="info-card">
        <div class="info-card-header">Saved Draft Details</div>
        {{-- <div class="info-row">
            <span class="info-label">Application ID &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="font-family: monospace;">{{ $app->id }}</span>
        </div> --}}
        <div class="info-row">
            <span class="info-label">Registered Email&nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $app->applicant_email ?: $app->business_email }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Status&nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #7C2F3C;">Draft</span>
        </div>
        <div class="info-row">
            <span class="info-label">Last Saved&nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ now()->format('d M Y, H:i T') }}</span>
        </div>
    </div>

    <div class="highlight-box">
        <div class="highlight-box-title">Important Reminder</div>
        <p style="font-size: 13px; color: #461220; line-height: 1.5;">
            Applications in <strong>Draft</strong> status are not yet reviewed by our admissions team.
            Please ensure you review all required documentation and click <strong>Submit Application</strong> once ready.
        </p>
    </div>

    <div class="cta-wrap">
        <a href="{{ $portalUrl }}" class="cta-button" target="_blank">
            Resume Your Application &rarr;
        </a>
    </div>

    <p class="workspace-notice">
        Need assistance completing your application? Reach us at
        <a href="mailto:{{ $supportEmail }}" style="color: #650B23; font-weight: bold; text-decoration: none;">{{ $supportEmail }}</a>.
    </p>
@endsection
