@extends('emails.layouts.ispau')

@section('title', $isInternalNotice ? 'New Application Received' : 'Application Received | ' . ($appName ?? 'ISPAU'))
@section('eyebrow', $isInternalNotice ? 'Internal Notice' : 'Membership Application')
@section('header-title', $isInternalNotice ? 'New Application Submitted' : 'Application Received')
@section('header-subtitle', $isInternalNotice
    ? 'A new membership application has been submitted and is ready for administrative review.'
    : 'Thank you for applying to join the Internet Service Providers Association of Uganda (ISPAU).')

@section('content')
    <p class="greeting">
        {{ $isInternalNotice ? 'Hello ISPAU Team,' : 'Dear ' . ($app->applicant_name ?: 'Applicant') . ',' }}
    </p>

    <p class="intro">
        @if ($isInternalNotice)
            A new membership application has been submitted by <strong>{{ $app->legal_name }}</strong> and is queued for verification.
        @else
            We have successfully received your membership application for <strong>{{ $app->legal_name }}</strong>.
            Our team has begun the review and verification process.
        @endif
    </p>

    <div class="info-card">
        <div class="info-card-header">Application Overview</div>
        {{-- <div class="info-row">
            <span class="info-label">Application ID &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="font-family: monospace;">{{ $app->id }}</span>
        </div> --}}
        <div class="info-row">
            <span class="info-label">Organisation &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $app->legal_name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Requested Tier</span>
            <span class="info-value">&nbsp;&nbsp;&nbsp;{{ $app->requested_tier ?: 'Unassigned' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Category</span>
            <span class="info-value">&nbsp;&nbsp;&nbsp;{{ $app->category ?: 'General' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Current Status &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #650B23;">Submitted</span>
        </div>
        <div class="info-row">
            <span class="info-label">Submission Date</span>
            <span class="info-value">{{ now()->format('d M Y, H:i T') }}</span>
        </div>
    </div>

    @if (! $isInternalNotice)
        <div class="highlight-box">
            <div class="highlight-box-title">What Happens Next?</div>
            <ol>
                <li><strong>Document Verification: &nbsp;&nbsp;&nbsp;</strong> Our secretariat verifies your registration details, regulatory standing, and uploaded credentials.</li>
                <li><strong>Clarifications (if needed): &nbsp;&nbsp;&nbsp;</strong> If any details require amendment, you will receive an email request to update them.</li>
                <li><strong>Committee Decision: &nbsp;&nbsp;&nbsp;</strong> Once verified, your application is submitted to the Admissions Committee for formal admission and tier confirmation.</li>
            </ol>
        </div>
    @endif

    <div class="cta-wrap">
        <a href="{{ $portalUrl }}" class="cta-button" target="_blank">
            {{ $isInternalNotice ? 'Review in Admin Workspace &rarr;' : 'Track Application Status &rarr;' }}
        </a>
    </div>

    <p class="workspace-notice">
        Have questions or need assistance? Reach out to ISPAU support at
        <a href="mailto:{{ $supportEmail }}" style="color: #650B23; font-weight: bold; text-decoration: none;">{{ $supportEmail }}</a>.
    </p>
@endsection
