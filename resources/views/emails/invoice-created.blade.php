@extends('emails.layouts.ispau')

@section('title', 'Membership Invoice #' . $invoice->invoice_number . ' | ' . ($appName ?? 'ISPAU'))
@section('eyebrow', 'Finance & Billing')
@section('header-title', 'New Membership Invoice')
@section('header-subtitle', 'An invoice has been generated for your ISPAU membership.')

@section('content')
    <p class="greeting">
        Dear {{ $applicantName }},
    </p>

    <p class="intro">
        A new invoice (<strong>#{{ $invoice->invoice_number }}</strong>) has been generated for your membership. Please find the summary below for your accounting records.
    </p>

    <div class="info-card">
        <div class="info-card-header">Invoice Summary</div>
        <div class="info-row">
            <span class="info-label">Invoice Number &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">#{{ $invoice->invoice_number }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Issued To &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $applicantName }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Billing Period &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $invoice->membership_period ?? 'N/A' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Issue Date &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $invoice->invoice_date ? \Carbon\Carbon::parse($invoice->invoice_date)->format('d M Y') : now()->format('d M Y') }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Payment Status &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #650B23; font-weight: bold;">{{ $invoice->payment_status ?? 'Pending' }}</span>
        </div>
        <div class="info-row" style="border-top: 1px solid #e3d6da; margin-top: 8px; padding-top: 8px;">
            <span class="info-label" style="font-weight: bold;">Total Due &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="font-size: 16px; font-weight: bold; color: #650B23;">
                USD {{ number_format((float) ($invoice->total ?? 0), 2) }}
            </span>
        </div>
    </div>

    <div class="highlight-box">
        <div class="highlight-box-title">Settlement Instructions</div>
        <ol>
            <li><strong>Bank Transfer: &nbsp;&nbsp;&nbsp;</strong> Please refer to the banking instructions in your portal dashboard for electronic funds transfer (EFT).</li>
            <li><strong>Proof of Payment: &nbsp;&nbsp;&nbsp;</strong> Once payment is initiated, please share your remittance advice or bank confirmation with our secretariat.</li>
            <li><strong>Account Activation: &nbsp;&nbsp;&nbsp;</strong> Your membership status will automatically update upon payment clearance.</li>
        </ol>
    </div>

    <div class="cta-wrap">
        <a href="{{ $portalUrl }}" class="cta-button" target="_blank">
            View Invoices in Portal &rarr;
        </a>
    </div>

    <p class="workspace-notice">
        For billing questions or reconciliation assistance, please contact the ISPAU Finance Team at
        <a href="mailto:{{ $supportEmail }}" style="color: #650B23; font-weight: bold; text-decoration: none;">{{ $supportEmail }}</a>.
    </p>
@endsection
