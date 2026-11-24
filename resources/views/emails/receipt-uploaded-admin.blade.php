@extends('emails.layouts.ispau')

@section('title', 'Proof of Payment Uploaded — Invoice #' . $invoiceNumber . ' | ' . ($appName ?? 'ISPAU'))
@section('eyebrow', 'Finance Notice')
@section('header-title', 'Payment Receipt Uploaded')
@section('header-subtitle', 'An applicant has uploaded proof of payment and is awaiting finance verification.')

@section('content')
    <p class="greeting">
        Hello ISPAU Finance Team,
    </p>

    <p class="intro">
        A payment receipt / proof of remittance has been uploaded by <strong>{{ $applicantName }}</strong> for <strong>Invoice #{{ $invoiceNumber }}</strong>.
    </p>

    <div class="info-card">
        <div class="info-card-header">Payment Submission Details</div>
        <div class="info-row">
            <span class="info-label">Invoice Number &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">#{{ $invoiceNumber }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Applicant / Org &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $applicantName }}</span>
        </div>
        @if ($applicantEmail)
        <div class="info-row">
            <span class="info-label">Contact Email &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ $applicantEmail }}</span>
        </div>
        @endif
        <div class="info-row">
            <span class="info-label">Current Status &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #650B23; font-weight: bold;">Receipt Uploaded / Pending Reconciliation</span>
        </div>
        <div class="info-row">
            <span class="info-label">Upload Timestamp &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value">{{ now()->format('d M Y, H:i T') }}</span>
        </div>
    </div>

    <div class="highlight-box">
        <div class="highlight-box-title">Required Actions</div>
        <ol>
            <li><strong>Reconciliation: &nbsp;&nbsp;&nbsp;</strong> Confirm the corresponding bank credit against the associated remittance advice.</li>
            <li><strong>Payment Recording: &nbsp;&nbsp;&nbsp;</strong> Create and verify the payment entry in the finance admin console.</li>
            <li><strong>Confirmation: &nbsp;&nbsp;&nbsp;</strong> Updating the invoice status to "Confirmed" will notify the applicant and update their membership standing.</li>
        </ol>
    </div>

    <div class="cta-wrap">
        <a href="{{ $portalUrl }}" class="cta-button" target="_blank">
            Review Receipt in Finance Console &rarr;
        </a>
    </div>

    <p class="workspace-notice">
        This is an automated internal alert dispatched to the ISPAU Finance Division.
    </p>
@endsection

