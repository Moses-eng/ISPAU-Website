@extends('emails.layouts.ispau')

@section('title', 'Application Status Updated | ' . ($appName ?? 'ISPAU'))
@section('eyebrow', 'Membership Application')
@section('header-title', 'Status Update')
@section('header-subtitle', 'There is an update on your ISPAU membership application review.')

@section('content')
    <p class="greeting">Dear {{ $app->applicant_name ?: 'Applicant' }},</p>

    <p class="intro">
        The review status of your membership application for <strong>{{ $app->legal_name }}</strong> has been updated.
    </p>

    <div class="info-card">
        <div class="info-card-header">Status Information</div>
        <div class="info-row">
            <span class="info-label">Organisation</span>
            <span class="info-value">{{ $app->legal_name }}</span>
        </div>
        {{-- <div class="info-row">
            <span class="info-label">Application ID &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="font-family: monospace;">{{ $app->id }}</span>
        </div> --}}
        <div class="info-row">
            <span class="info-label">New Status&nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #650B23; font-size: 14px; font-weight: 600;">{{ $status }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Updated At&nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ now()->format('d M Y, H:i T') }}</span>
        </div>
    </div>

    @if ($status === 'Submitted')
        <div class="highlight-box">
            <div class="highlight-box-title">Application Submitted&nbsp;&nbsp;&nbsp;</div>
            <p style="font-size: 13px; color: #461220;">Your membership application has been received and queued for initial verification by the ISPAU compliance team.</p>
        </div>
    @elseif ($status === 'Under review')
        <div class="highlight-box">
            <div class="highlight-box-title">Under Review&nbsp;&nbsp;&nbsp;</div>
            <p style="font-size: 13px; color: #461220;">An ISPAU compliance officer has begun active verification of your application details and supporting documents.</p>
        </div>
    @elseif ($status === 'Clarification needed')
        <div class="highlight-box" style="border-left-color: #a43b3b;">
            <div class="highlight-box-title">Clarification Requested&nbsp;&nbsp;&nbsp;</div>
            <p style="font-size: 13px; color: #461220;">Our reviewers require additional documentation or information before proceeding. Please log in to view and reply to the requested items.</p>
        </div>
    @elseif ($status === 'Decision pending')
        <div class="highlight-box" style="border-left-color: #7c2f3c;">
            <div class="highlight-box-title">Decision Pending&nbsp;&nbsp;&nbsp;</div>
            <p style="font-size: 13px; color: #461220;">Verification of your application is complete. It has now been submitted for a formal admission decision by the ISPAU executive committee.</p>
        </div>
    @elseif ($status === 'Approved awaiting payment')
        <div class="highlight-box" style="border-left-color: #16734a;">
            <div class="highlight-box-title">Congratulations — Application Approved!</div>
            <p style="font-size: 13px; color: #461220;">Your membership application has been approved. Please log in to complete your membership subscription payment and activate your standing.</p>
        </div>
    @elseif ($status === 'Active')
        <div class="highlight-box" style="border-left-color: #16734a;">
            <div class="highlight-box-title">Membership Activated&nbsp;&nbsp;&nbsp;</div>
            <p style="font-size: 13px; color: #461220;">Your organisation is now an active member of ISPAU with full voting rights and directory access.</p>
        </div>
    @elseif ($status === 'Deferred')
        <div class="highlight-box" style="border-left-color: #7c2f3c;">
            <div class="highlight-box-title">Application Deferred&nbsp;&nbsp;&nbsp;</div>
            <p style="font-size: 13px; color: #461220;">A decision on your membership application has been deferred pending further review or satisfaction of membership prerequisites. Please log in to see details.</p>
        </div>
    @elseif ($status === 'Declined')
        <div class="highlight-box" style="border-left-color: #a43b3b;">
            <div class="highlight-box-title">Application Declined&nbsp;&nbsp;&nbsp;</div>
            <p style="font-size: 13px; color: #461220;">We regret to inform you that your membership application has not been approved at this time. Please log in to review the decision remarks or reach out to support.</p>
        </div>
    @elseif ($status === 'Draft')
        <div class="highlight-box">
            <div class="highlight-box-title">Draft Application&nbsp;&nbsp;&nbsp;</div>
            <p style="font-size: 13px; color: #461220;">Your membership application is currently saved as a draft. Please complete all required sections and submit it for official review.</p>
        </div>
    @endif

    <div class="cta-wrap">
        <a href="{{ $portalUrl }}" class="cta-button" target="_blank">
            View Application Details &rarr;
        </a>
    </div>

    <p class="workspace-notice">
        Have any questions? Reach out to ISPAU support at
        <a href="mailto:{{ $supportEmail }}" style="color: #650B23; font-weight: bold; text-decoration: none;">{{ $supportEmail }}</a>.
    </p>
@endsection
