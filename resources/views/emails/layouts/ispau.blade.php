{{-- resources/views/emails/layouts/ispau.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'ISPAU Administrator Workspace')</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

        body {
            background-color: #F7F0F2;
            color: #2B1C21;
            line-height: 1.6;
            margin: 0;
            padding: 28px 12px;
            width: 100% !important;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 12px 32px rgba(70, 18, 32, 0.08);
            border: 1px solid #E3D6DA;
        }

        .brand-top-strip {
            height: 6px;
            width: 100%;
            background: linear-gradient(90deg, #650B23 0%, #7C2F3C 100%);
        }

        .email-header {
            background: linear-gradient(145deg, #461220 0%, #650B23 100%);
            padding: 36px 32px 30px;
            text-align: center;
            color: #FFFFFF;
        }

        .eyebrow-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid #DBC6CC;
            color: #F7F0F2;
            padding: 4px 14px;
            border-radius: 99px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-bottom: 14px;
        }

        .email-title {
            font-size: 22px;
            font-weight: 800;
            line-height: 1.35;
            color: #FFFFFF;
            margin-bottom: 8px;
        }

        .email-subtitle {
            font-size: 13px;
            color: #DBC6CC;
            max-width: 440px;
            margin: 0 auto;
            line-height: 1.5;
        }

        .email-body {
            padding: 34px 32px 24px;
        }

        .greeting {
            font-size: 16px;
            font-weight: 700;
            color: #2B1C21;
            margin-bottom: 12px;
        }

        .intro {
            font-size: 14px;
            color: #6C5960;
            line-height: 1.6;
            margin-bottom: 20px;
        }

        .info-card {
            background-color: #FAF5F6;
            border-radius: 10px;
            border: 1px solid #E3D6DA;
            border-left: 4px solid #650B23;
            padding: 16px 20px;
            margin: 22px 0;
        }

        .info-card-header {
            font-size: 11px;
            font-weight: 800;
            color: #650B23;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding-bottom: 8px;
            margin-bottom: 10px;
            border-bottom: 1px solid #E3D6DA;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            font-size: 13px;
            border-bottom: 1px dashed #E3D6DA;
        }

        .info-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .info-label {
            color: #6C5960;
            font-weight: 500;
        }

        .info-value {
            color: #2B1C21;
            font-weight: 700;
            text-align: right;
            word-break: break-all;
        }

        .highlight-box {
            background-color: #F7F0F2;
            border-radius: 10px;
            border: 1px solid #E3D6DA;
            border-left: 4px solid #7C2F3C;
            padding: 18px 20px;
            margin: 22px 0;
        }

        .highlight-box-title {
            font-size: 12px;
            font-weight: 800;
            color: #461220;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 8px;
        }

        .highlight-box ol, .highlight-box ul {
            margin-left: 18px;
            color: #461220;
            font-size: 13px;
        }

        .highlight-box li {
            margin-bottom: 6px;
            line-height: 1.5;
        }

        .cta-wrap {
            text-align: center;
            margin: 28px 0;
        }

        .cta-button {
            display: inline-block;
            background-color: #650B23;
            color: #FFFFFF !important;
            padding: 13px 34px;
            border-radius: 7px;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            box-shadow: 0 6px 14px rgba(101, 11, 35, 0.22);
        }

        .cta-button:hover {
            background-color: #461220;
        }

        .workspace-notice {
            font-size: 12px;
            color: #6C5960;
            text-align: center;
            padding: 12px 16px;
            background: #FAF5F6;
            border-radius: 8px;
            margin-top: 20px;
        }

        .email-footer {
            background-color: #FAF5F6;
            border-top: 1px solid #E3D6DA;
            padding: 22px 24px;
            text-align: center;
            font-size: 12px;
            color: #6C5960;
        }

        .copyright {
            margin-top: 8px;
            font-size: 11px;
            color: #8D7B82;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="brand-top-strip"></div>
        <div class="email-header">
            <span class="eyebrow-badge">@yield('eyebrow', 'ISPAU Administration')</span>
            <h1 class="email-title">@yield('header-title')</h1>
            <p class="email-subtitle">@yield('header-subtitle')</p>
        </div>
        <div class="email-body">
            @yield('content')
        </div>
        <div class="email-footer">
            <p><strong>{{ $appName ?? 'ISPAU' }} Administrator Workspace</strong></p>
            <p class="copyright">
                &copy; {{ date('Y') }} {{ $appName ?? 'ISPAU' }}. All rights reserved.<br>
                This email was sent to an authorized administrator account.
            </p>
        </div>
    </div>
</body>
</html>
