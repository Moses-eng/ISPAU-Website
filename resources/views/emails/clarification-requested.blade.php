{{-- resources/views/emails/clarification-requested.blade.php --}}
@extends('emails.layouts.ispau')

@section('title', 'Action Required: Clarification Requested | ' . ($appName ?? 'ISPAU'))
@section('eyebrow', 'Application Review Notice')
@section('header-title', 'Clarification Required')
@section('header-subtitle', 'Our review team has requested additional information or amendments regarding your application.')

@section('content')
    <p class="greeting">Dear {{ $applicantName }},</p>

    <p class="intro">
        Thank you for submitting your membership application for <strong>{{ $organisationName }}</strong>.
        During our verification process, our review team identified specific items that require your clarification or revision.
    </p>

    <!-- Review Summary Card -->
    <div class="info-card">
        <div class="info-card-header">Application Review Details</div>
        <div class="info-row">
            <span class="info-label">Organisation &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $organisationName }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Review Status &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #650B23;">Clarification Needed</span>
        </div>
        <div class="info-row">
            <span class="info-label">Reviewer &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $reviewerName }}</span>
        </div>
    </div>

    <!-- Items to Clarify -->
    <div class="highlight-box">
        <div class="highlight-box-title">Required Actions / Points of Clarification</div>
        <ol>
            @foreach ($items as $item)
                <li>{{ $item }}</li>
            @endforeach
        </ol>
    </div>

    <!-- CTA Button -->
    <div class="cta-wrap">
        <a href="{{ $portalUrl }}" class="cta-button" target="_blank">
            Sign In &amp; Provide Response &rarr;
        </a>
    </div>

    <div class="highlight-box" style="background-color: #FAF5F6; border-left: 4px solid #650B23;">
        <div class="highlight-box-title">Next Steps</div>
        <ul>
            <li>Sign in to the application portal using your registered email address.</li>
            <li>Submit a consolidated response addressing each of the points listed above.</li>
            <li>Once submitted, your application review will resume immediately.</li>
        </ul>
    </div>

    <p class="workspace-notice">
        If you have any questions about this request, reply directly to this email or reach us at
        <a href="mailto:{{ $supportEmail }}" style="color: #650B23; font-weight: bold; text-decoration: none;">{{ $supportEmail }}</a>.
    </p>
@endsection
