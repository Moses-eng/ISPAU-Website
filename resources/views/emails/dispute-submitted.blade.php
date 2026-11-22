@extends('emails.layouts.ispau')

@section('title', $isInternalNotice ? 'New Dispute Request Received' : 'Dispute Request Received | ' . ($appName ?? 'ISPAU'))
@section('eyebrow', $isInternalNotice ? 'Internal Notice' : 'Customer Rights & Dispute Service')
@section('header-title', $isInternalNotice ? 'New Dispute / Appeal Filed' : 'Request Successfully Logged')
@section('header-subtitle', $isInternalNotice
    ? 'A customer has submitted a formal dispute or record appeal requiring administrative review.'
    : 'Thank you for contacting the Internet Service Providers Association of Uganda (ISPAU).')

@section('content')
    <p class="greeting" style="color: #461220; font-weight: 600;">
        {{ $isInternalNotice ? 'Hello ISPAU Secretariat Team,' : 'Dear ' . ($dispute->name ?: 'Customer') . ',' }}
    </p>

    <p class="intro" style="color: #2b1c21; line-height: 1.5;">
        @if ($isInternalNotice)
            A new dispute/appeal request has been submitted by <strong style="color: #650B23;">{{ $dispute->name }}</strong> and is waiting for Secretariat assignment.
        @else
            We have received your record dispute or appeal submission for <strong style="color: #650B23;">{{ $dispute->name }}</strong>.
            Your request has been logged under the reference details below and will be handled confidentially.
        @endif
    </p>

    <div class="info-card" style="background-color: #ffffff; border: 1px solid #e3d6da; border-radius: 8px; margin: 24px 0; padding: 20px;">
        <div class="info-card-header" style="color: #650B23; font-weight: 700; border-bottom: 2px solid #f7f0f2; padding-bottom: 8px; margin-bottom: 12px;">
            Request Overview
        </div>

        <div class="info-row" style="margin-bottom: 8px;">
            <span class="info-label" style="color: #6c5960;">Dispute ID &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="font-family: monospace; font-weight: 700; color: #650B23;">{{ $dispute->id }}</span>
        </div>

        <div class="info-row" style="margin-bottom: 8px;">
            <span class="info-label" style="color: #6c5960;">Customer Name &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #2b1c21; font-weight: 600;">{{ $dispute->name }}</span>
        </div>

        <div class="info-row" style="margin-bottom: 8px;">
            <span class="info-label" style="color: #6c5960;">Contact Email &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #2b1c21;">{{ $dispute->email }}</span>
        </div>

        @if (! empty($dispute->recordId))
            <div class="info-row" style="margin-bottom: 8px;">
                <span class="info-label" style="color: #6c5960;">Case Reference &nbsp;&nbsp;&nbsp;</span>
                <span class="info-value" style="font-family: monospace; color: #461220;">{{ $dispute->recordId }}</span>
            </div>
        @endif

        <div class="info-row" style="margin-bottom: 8px;">
            <span class="info-label" style="color: #6c5960;">Current Status &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #650B23; font-weight: 700; text-transform: uppercase;">{{ $dispute->status ?: 'Pending' }}</span>
        </div>

        <div class="info-row" style="margin-bottom: 8px;">
            <span class="info-label" style="color: #6c5960;">Date Logged &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #2b1c21;">{{ now()->format('d M Y, H:i T') }}</span>
        </div>

        <div class="info-row" style="margin-top: 12px; border-top: 1px dashed #e3d6da; padding-top: 8px;">
            <span class="info-label" style="color: #6c5960; display: block; margin-bottom: 4px;">Reason / Submission Details:</span>
            <span class="info-value" style="display: block; background-color: #f7f0f2; border-left: 3px solid #650B23; padding: 10px; color: #461220; font-size: 13px; line-height: 1.4;">
                {{ $dispute->reason }}
            </span>
        </div>
    </div>

    @if (! $isInternalNotice)
        <div class="highlight-box" style="background-color: #f7f0f2; border-left: 4px solid #650B23; border-radius: 4px; padding: 16px; margin: 20px 0;">
            <div class="highlight-box-title" style="color: #461220; font-weight: 700; margin-bottom: 8px;">Next Steps for Verification</div>
            <ol style="margin: 0; padding-left: 20px; color: #2b1c21; font-size: 13px; line-height: 1.6;">
                <li><strong style="color: #650B23;">Identity Review: &nbsp;&nbsp;&nbsp;</strong> The Secretariat verifies authority to make requests on behalf of the named business.</li>
                <li><strong style="color: #650B23;">Record Marking: &nbsp;&nbsp;&nbsp;</strong> Any contested claims are flagged as disputed pending independent review.</li>
                <li><strong style="color: #650B23;">Resolution & Response: &nbsp;&nbsp;&nbsp;</strong> A formal outcome will be communicated to your business email.</li>
            </ol>
        </div>
    @endif

    @if ($portalUrl)
        <div class="cta-wrap" style="text-align: center; margin: 28px 0;">
            <a href="{{ $portalUrl }}" class="cta-button" target="_blank" style="background-color: #650B23; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
                {{ $isInternalNotice ? 'Review in Admin Workspace &rarr;' : 'Return to ISPAU Portal &rarr;' }}
            </a>
        </div>
    @endif

    <p class="workspace-notice" style="font-size: 13px; color: #6c5960; margin-top: 24px;">
        Have questions or need assistance? Reach out to the ISPAU Secretariat directly at
        <a href="mailto:{{ $supportEmail }}" style="color: #650B23; font-weight: bold; text-decoration: none;">{{ $supportEmail }}</a>.
    </p>
@endsection
