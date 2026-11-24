<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $appName }} — Subscription Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                    <tr>
                        <td style="background:#650B23;padding:24px 32px;color:#ffffff;">
                            <h1 style="margin:0;font-size:20px;">{{ $appName }}</h1>
                            <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">Annual Subscription Notice</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 16px;font-size:15px;">Dear <strong>{{ $applicantName }}</strong>,</p>

                            @if ($reminderType === 'expired')
                                <p style="margin:0 0 16px;font-size:15px;color:#b91c1c;">
                                    Your annual subscription <strong>has expired</strong>.
                                    Please renew to continue enjoying our services.
                                </p>
                            @else
                                <p style="margin:0 0 16px;font-size:15px;">
                                    This is a friendly reminder that your annual subscription is
                                    <strong>approaching its expiry date</strong>.
                                </p>
                            @endif

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                   style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:16px 0;">
                                <tr>
                                    <td style="padding:16px 20px;font-size:14px;line-height:1.7;">
                                        <div><strong>Subscription Start:</strong>
                                            {{ optional($subscription->starts_at)->format('d M Y') }}</div>
                                        <div><strong>Subscription Expiry:</strong>
                                            {{ optional($subscription->ends_at)->format('d M Y') }}</div>
                                        <div><strong>Status:</strong>
                                            {{ ucfirst($subscription->status) }}</div>
                                        @if ($reminderType !== 'expired')
                                            <div><strong>Days Remaining:</strong>
                                                {{ $subscription->days_remaining }}</div>
                                        @endif
                                    </td>
                                </tr>
                            </table>

                            @if ($reminderType === 'expired')
                                <p style="margin:0 0 8px;font-size:14px;">
                                    To renew, please make a new payment through your applicant portal.
                                    Once your payment is confirmed, your subscription will be
                                    reactivated for another 365 days.
                                </p>
                            @else
                                <p style="margin:0 0 8px;font-size:14px;">
                                    You can renew at any time through your applicant portal. Your
                                    subscription will be renewed immediately upon payment confirmation.
                                </p>
                            @endif

                            <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
                                If you have any questions, reply to this email or contact our support team.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="background:#f9fafb;padding:16px 32px;font-size:12px;color:#6b7280;text-align:center;">
                            &copy; {{ date('Y') }} {{ $appName }}. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
