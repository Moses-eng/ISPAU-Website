@extends('emails.layouts.ispau')

@section('title', $isInternalNotice ? 'New Contact Enquiry Received' : 'Enquiry Received | ' . ($appName ?? 'ISPAU'))
@section('eyebrow', $isInternalNotice ? 'Internal Notice' : 'Secretariat Enquiries')
@section('header-title', $isInternalNotice ? 'New Contact Enquiry Submitted' : 'Thank You for Reaching Out')
@section('header-subtitle', $isInternalNotice
    ? 'A new message has been submitted through the public contact desk and is ready for secretariat review.'
    : 'We have received your message and a representative from ISPAU will review it shortly.')

@section('content')
    <p class="greeting" style="color: #461220; font-weight: 600;">
        {{ $isInternalNotice ? 'Hello ISPAU Secretariat Team,' : 'Dear ' . ($contact->name ?: 'Colleague') . ',' }}
    </p>

    <p class="intro" style="color: #2b1c21; line-height: 1.5;">
        @if ($isInternalNotice)
            A new enquiry has been submitted by <strong style="color: #650B23;">{{ $contact->name }}</strong> from <strong style="color: #461220;">{{ $contact->organisation ?: 'Independent' }}</strong> regarding <em>{{ $contact->enquiry_type }}</em>.
        @else
            Thank you for contacting the Internet Service Providers Association of Uganda (ISPAU). We have logged your enquiry regarding <strong style="color: #650B23;">{{ $contact->enquiry_type }}</strong>.
        @endif
    </p>

    <div class="info-card" style="background-color: #ffffff; border: 1px solid #e3d6da; border-radius: 8px; margin: 24px 0; padding: 20px;">
        <div class="info-card-header" style="color: #650B23; font-weight: 700; border-bottom: 2px solid #f7f0f2; padding-bottom: 8px; margin-bottom: 12px;">
            Enquiry Summary
        </div>

        <div class="info-row" style="margin-bottom: 8px;">
            <span class="info-label" style="color: #6c5960;">Sender Name &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #2b1c21; font-weight: 600;">{{ $contact->name }}</span>
        </div>

        <div class="info-row" style="margin-bottom: 8px;">
            <span class="info-label" style="color: #6c5960;">Organisation &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #2b1c21;">{{ $contact->organisation ?: 'Not specified' }}</span>
        </div>

        <div class="info-row" style="margin-bottom: 8px;">
            <span class="info-label" style="color: #6c5960;">Work Email &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #2b1c21; font-weight: 600;">{{ $contact->work_email }}</span>
        </div>

        <div class="info-row" style="margin-bottom: 8px;">
            <span class="info-label" style="color: #6c5960;">Enquiry Type &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #650B23; font-weight: 700;">{{ $contact->enquiry_type }}</span>
        </div>

        <div class="info-row" style="margin-bottom: 8px;">
            <span class="info-label" style="color: #6c5960;">Date Received &nbsp;&nbsp;&nbsp;</span>
            <span class="info-value" style="color: #2b1c21;">{{ now()->format('d M Y, H:i T') }}</span>
        </div>

        <div class="info-row" style="margin-top: 14px; border-top: 1px dashed #e3d6da; padding-top: 10px;">
            <span class="info-label" style="color: #6c5960; display: block; margin-bottom: 6px; font-weight: 600;">Message Content:</span>
            <span class="info-value" style="display: block; background-color: #f7f0f2; border-left: 3px solid #650B23; padding: 12px; color: #461220; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">{{ $contact->message }}</span>
        </div>
    </div>

    @if (! $isInternalNotice)
        <div class="highlight-box" style="background-color: #f7f0f2; border-left: 4px solid #650B23; border-radius: 4px; padding: 16px; margin: 20px 0;">
            <div class="highlight-box-title" style="color: #461220; font-weight: 700; margin-bottom: 8px;">What Happens Next?</div>
            <ol style="margin: 0; padding-left: 20px; color: #2b1c21; font-size: 13px; line-height: 1.6;">
                <li><strong style="color: #650B23;">Secretariat Review: &nbsp;&nbsp;&nbsp;</strong> Enquiries are routed to the relevant portfolio lead (Membership, Policy, or Technical Services).</li>
                <li><strong style="color: #650B23;">Response Timeline: &nbsp;&nbsp;&nbsp;</strong> We aim to reply to all business correspondence within 1 to 2 business days.</li>
                <li><strong style="color: #650B23;">Direct Follow-up: &nbsp;&nbsp;&nbsp;</strong> Any requested documentation or guidance will be sent directly to your work email.</li>
            </ol>
        </div>
    @endif

    @if ($portalUrl)
        <div class="cta-wrap" style="text-align: center; margin: 28px 0;">
            <a href="{{ $portalUrl }}" class="cta-button" target="_blank" style="background-color: #650B23; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
                {{ $isInternalNotice ? 'View Enquiries in Admin Portal &rarr;' : 'Visit ISPAU Website &rarr;' }}
            </a>
        </div>
    @endif

    <p class="workspace-notice" style="font-size: 13px; color: #6c5960; margin-top: 24px;">
        Need immediate assistance? You may contact ISPAU directly at
        <a href="mailto:{{ $supportEmail }}" style="color: #650B23; font-weight: bold; text-decoration: none;">{{ $supportEmail }}</a>
        or call <span style="color: #461220; font-weight: 600;">+256 781 492 412</span>.
    </p>
@endsection
