@extends('emails.layouts.ispau')

@section('title', 'Payment Receipt #' . $payment->payment_no . ' | ' . ($appName ?? 'ISPAU'))
@section('eyebrow', 'Finance & Billing')
@section('header-title', 'Payment Confirmation')
@section('header-subtitle', 'Your payment has been successfully recorded and processed.')

@section('content')
    <p class="greeting">
        Dear {{ $applicantName }},
    </p>

    <p class="intro">
        Thank you! We have received your payment of <strong>USD {{ number_format((float) ($payment->amount ?? 0), 2) }}</strong>. Your official payment receipt details are outlined below.
    </p>

    <div class="info-card">
        <div class="info-card-header">Payment Receipt Details</div>
        <div class="info-row">
            <span class="info-label">Receipt Number &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">#{{ $payment->payment_no }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Applicant / Member &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $applicantName }}</span>
        </div>
        @if (!empty($payment->payment_reference))
        <div class="info-row">
            <span class="info-label">Payment Reference &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $payment->payment_reference }}</span>
        </div>
        @endif
        @if (!empty($payment->period))
        <div class="info-row">
            <span class="info-label">Membership Period &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $payment->period }}</span>
        </div>
        @endif
        <div class="info-row">
            <span class="info-label">Payment Date &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $payment->paid_at ? \Carbon\Carbon::parse($payment->paid_at)->format('d M Y, H:i T') : now()->format('d M Y, H:i T') }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Payment Status &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #16734a; font-weight: bold;">Confirmed / Paid</span>
        </div>
        <div class="info-row">
            <span class="info-label">Application Status &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #16734a; font-weight: bold; font-size: 14px;">
                {{ $status ?? 'Active' }}
            </span>
        </div>
        <div class="info-row" style="border-top: 1px solid #e3d6da; margin-top: 8px; padding-top: 8px;">
            <span class="info-label" style="font-weight: bold;">Amount Paid &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="font-size: 16px; font-weight: bold; color: #650B23;">
                USD {{ number_format((float) ($payment->amount ?? 0), 2) }}
            </span>
        </div>
    </div>

    <div class="highlight-box">
        <div class="highlight-box-title">Next Steps & Account Information</div>
        <ol>
            <li><strong>Membership Ledger: &nbsp;&nbsp;&nbsp;</strong> Your payment has been credited to your membership billing balance.</li>
            <li><strong>Official Receipt: &nbsp;&nbsp;&nbsp;</strong> You can view and download all formal receipts and account statements in your portal dashboard.</li>
            <li><strong>Active Standing: &nbsp;&nbsp;&nbsp;</strong> Your application and membership status is now <strong>{{ $status ?? 'Active' }}</strong> with full member privileges.</li>
        </ol>
    </div>

    <div class="cta-wrap">
        <a href="{{ $portalUrl }}" class="cta-button" target="_blank">
            View Payments & Receipts &rarr;
        </a>
    </div>

    <p class="workspace-notice">
        Have questions regarding this payment or your account balance? Contact our finance team at
        <a href="mailto:{{ $supportEmail }}" style="color: #650B23; font-weight: bold; text-decoration: none;">{{ $supportEmail }}</a>.
    </p>
@endsection
