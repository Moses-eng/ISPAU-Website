@extends('emails.layouts.ispau')

@section('title', 'Application Verification Recorded | ' . ($appName ?? 'ISPAU'))
@section('eyebrow', 'Membership Compliance')
@section('header-title', 'Verification Recorded')
@section('header-subtitle', 'Verification checks have been recorded for your membership application.')

@section('content')
    <p class="greeting">Dear {{ $applicantName ?: 'Valued Applicant' }},</p>

    <p class="intro">
        The ISPAU compliance and review team has completed and recorded formal verification checks on your membership application.
    </p>

    <div class="info-card">
        <div class="info-card-header">Verification Summary</div>
        @if (!empty($applicationNumber))
            <div class="info-row">
                <span class="info-label">Application No.&nbsp;&nbsp;&nbsp;</span>
                <span class="info-value" style="font-family: monospace; font-weight: 600;">{{ $applicationNumber }}</span>
            </div>
        @endif
        @if (!empty($verification->reviewer_name))
            <div class="info-row">
                <span class="info-label">Reviewed By&nbsp;&nbsp;&nbsp;</span>
                <span class="info-value">{{ $verification->reviewer_name }}</span>
            </div>
        @endif
        <div class="info-row">
            <span class="info-label">Recorded At&nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ now()->format('d M Y, H:i T') }}</span>
        </div>
    </div>

    @if (!empty($verification->checks) && is_iterable($verification->checks))
        <div style="margin: 24px 0;">
            <h3 style="font-size: 15px; color: #461220; margin-bottom: 12px; font-weight: 600;">
                Verification Checkpoints
            </h3>

            @foreach ($verification->checks as $key => $check)
                @php
                    $checkArray = (array) $check;
                    $label  = $checkArray['label'] ?? ucfirst((string) $key);
                    $result = $checkArray['result'] ?? 'Not applicable';
                    $note   = $checkArray['note'] ?? '';

                    $borderColor = match($result) {
                        'Verified'             => '#16734a',
                        'Clarification needed' => '#a43b3b',
                        default                => '#650B23',
                    };

                    $badgeBg = match($result) {
                        'Verified'             => '#eaf7f0',
                        'Clarification needed' => '#fbebeb',
                        default                => '#f5f5f5',
                    };
                @endphp

                <div class="highlight-box" style="border-left-color: {{ $borderColor }}; margin-bottom: 12px; padding: 12px 16px; background-color: #faf8f8;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong style="color: #461220; font-size: 13px;">{{ $label }}</strong>
                        <span style="font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: {{ $badgeBg }}; color: {{ $borderColor }};">
                            {{ $result }}
                        </span>
                    </div>

                    @if (!empty($note))
                        <p style="font-size: 13px; color: #555; margin: 4px 0 0 0; line-height: 1.4;">
                            <em>Review Note:</em> {{ $note }}
                        </p>
                    @endif
                </div>
            @endforeach
        </div>
    @endif

    <div class="cta-wrap" style="margin-top: 28px;">
        <a href="{{ $portalUrl }}" class="cta-button" target="_blank">
            View Application in Portal &rarr;
        </a>
    </div>

    <p class="workspace-notice" style="margin-top: 24px; font-size: 12px; color: #777;">
        Have questions regarding this verification? Contact ISPAU support at
        <a href="mailto:{{ $supportEmail }}" style="color: #650B23; font-weight: bold; text-decoration: none;">{{ $supportEmail }}</a>.
    </p>
@endsection
