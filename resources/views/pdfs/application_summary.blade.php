<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ISPAU Application Summary - {{ $app->legal_name ?? $app->id }}</title>
    <style>
        @page {
            margin: 22mm 15mm 20mm 15mm;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.45;
            color: #2b1c21; /* --text */
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        /* Running Header & Top Bar */
        .header-bar {
            width: 100%;
            border-bottom: 2.5px solid #650b23; /* --burgundy-primary */
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .header-bar table {
            width: 100%;
            border-collapse: collapse;
        }
        .logo-text {
            font-size: 20px;
            font-weight: bold;
            color: #650b23; /* --burgundy-primary */
            letter-spacing: 0.5px;
        }
        .logo-subtext {
            font-size: 9px;
            color: #6c5960; /* --muted */
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
        }
        .doc-title {
            text-align: right;
            font-size: 13px;
            font-weight: bold;
            color: #461220; /* --burgundy-deep */
            text-transform: uppercase;
        }
        .doc-subtitle {
            text-align: right;
            font-size: 9px;
            color: #6c5960; /* --muted */
        }

        /* Top Overview Card */
        .meta-card {
            background-color: #f7f0f2; /* --burgundy-tint */
            border: 1px solid #e3d6da; /* --border */
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 16px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
        }
        .meta-table td {
            font-size: 10px;
            padding: 2px 4px;
        }
        .meta-label {
            font-weight: bold;
            color: #6c5960; /* --muted */
            width: 18%;
        }
        .meta-value {
            color: #2b1c21; /* --text */
            width: 32%;
        }

        /* Section Headings */
        .section-title {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #ffffff;
            background-color: #650b23; /* --burgundy-primary */
            padding: 4px 8px;
            margin-top: 14px;
            margin-bottom: 6px;
            border-radius: 3px;
        }

        /* Data Tables */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            page-break-inside: avoid;
        }
        .data-table tr {
            border-bottom: 1px solid #e3d6da; /* --border */
        }
        .data-table td {
            padding: 4px 6px;
            vertical-align: top;
            font-size: 10px;
        }
        .data-label {
            width: 32%;
            font-weight: 600;
            color: #461220; /* --burgundy-deep */
            background-color: #fdfbfc;
            border-right: 1px solid #e3d6da; /* --border */
        }
        .data-value {
            width: 68%;
            color: #2b1c21; /* --text */
        }

        /* Status Badges */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            font-size: 9px;
            font-weight: bold;
            border-radius: 3px;
            text-transform: uppercase;
        }
        .badge-submitted {
            background: #f7f0f2; /* --burgundy-tint */
            color: #650b23; /* --burgundy-primary */
            border: 1px solid #e3d6da;
        }
        .badge-active {
            background: #e8f5ee; /* --success-bg */
            color: #16734a; /* --success */
            border: 1px solid #c8e7d7;
        }
        .badge-review {
            background: #f7f0f2; /* --warning-bg */
            color: #7c2f3c; /* --warning / wine */
            border: 1px solid #e3d6da;
        }
        .badge-declined {
            background: #fceaea; /* --danger-bg */
            color: #a43b3b; /* --danger */
            border: 1px solid #f6cfcf;
        }

        .check-yes {
            color: #16734a; /* --success */
            font-weight: bold;
        }
        .check-no {
            color: #6c5960; /* --muted */
        }

        /* Code / Path Tags */
        code {
            font-family: monospace;
            background-color: #f7f0f2;
            color: #7c2f3c; /* --burgundy-wine */
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 9px;
        }

        /* Footer Stamp */
        .footer-note {
            margin-top: 25px;
            border-top: 1px solid #e3d6da; /* --border */
            padding-top: 6px;
            font-size: 8px;
            color: #6c5960; /* --muted */
            text-align: center;
        }
    </style>
</head>
<body>

    <!-- Running Page Counter (Dompdf script) -->
    <script type="text/php">
        if (isset($pdf)) {
            $text = "ISPAU Confidential · Application Dossier · Page {PAGE_NUM} of {PAGE_COUNT}";
            $size = 8;
            $font = $fontMetrics->getFont("helvetica", "normal");
            $pdf->page_text(210, 810, $text, $font, $size, array(0.42, 0.35, 0.38));
        }
    </script>

    <!-- Header -->
    <div class="header-bar">
        <table>
            <tr>
                <td style="vertical-align: middle;">
                    <div class="logo-text">ISPAU</div>
                    <div class="logo-subtext">Internet Service Providers Association of Uganda</div>
                </td>
                <td style="vertical-align: middle;">
                    <div class="doc-title">Membership Application</div>
                    <div class="doc-subtitle">Official Summary Dossier · {{ $app->id }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Overview Metadata Box -->
    <div class="meta-card">
        <table class="meta-table">
            <tr>
                <td class="meta-label">Organisation:</td>
                <td class="meta-value"><strong>{{ $app->legal_name ?? 'Not provided' }}</strong></td>
                <td class="meta-label">Application Status:</td>
                <td class="meta-value">
                    <span class="badge badge-submitted">{{ $app->status ?? 'Submitted' }}</span>
                </td>
            </tr>
            <tr>
                <td class="meta-label">Requested Tier:</td>
                <td class="meta-value"><strong>{{ $app->requested_tier ?? 'Unassigned' }}</strong></td>
                <td class="meta-label">Category:</td>
                <td class="meta-value">{{ $app->category ?? 'Not specified' }}</td>
            </tr>
            <tr>
                <td class="meta-label">Submitted On:</td>
                <td class="meta-value">{{ optional($app->created_at)->format('d M Y, H:i') ?? 'N/A' }}</td>
                <td class="meta-label">Dossier Date:</td>
                <td class="meta-value">{{ date('d M Y, H:i') }} (EAT)</td>
            </tr>
        </table>
    </div>

    <!-- 1. Organisation Identity -->
    <div class="section-title">1. Organisation & Legal Identity</div>
    <table class="data-table">
        <tr>
            <td class="data-label">Legal Name</td>
            <td class="data-value"><strong>{{ $app->legal_name }}</strong></td>
        </tr>
        <tr>
            <td class="data-label">Trading / Brand Name</td>
            <td class="data-value">{{ $app->trading_name ?: 'Same as legal name' }}</td>
        </tr>
        <tr>
            <td class="data-label">Entity Type</td>
            <td class="data-value">{{ $app->entity_type }}</td>
        </tr>
        <tr>
            <td class="data-label">Registration Country / Number</td>
            <td class="data-value">{{ $app->registration_country }} · Ref: {{ $app->registration_reference }}</td>
        </tr>
        <tr>
            <td class="data-label">Registered Office Address</td>
            <td class="data-value">{{ $app->registered_address }}</td>
        </tr>
        <tr>
            <td class="data-label">Uganda Operating Address</td>
            <td class="data-value">{{ $app->uganda_address }}</td>
        </tr>
        <tr>
            <td class="data-label">Business Email / Phone</td>
            <td class="data-value">{{ $app->business_email }} · {{ $app->business_phone }}</td>
        </tr>
        <tr>
            <td class="data-label">Website</td>
            <td class="data-value">{{ $app->website ?: 'None provided' }}</td>
        </tr>
    </table>

    <!-- 2. Operational & Service Profile -->
    <div class="section-title">2. Operational Profile & Scope</div>
    <table class="data-table">
        <tr>
            <td class="data-label">Operational Status</td>
            <td class="data-value">{{ $app->operational_status }}</td>
        </tr>
        <tr>
            <td class="data-label">Customer-Facing Operations</td>
            <td class="data-value">{{ $app->customer_facing }}</td>
        </tr>
        <tr>
            <td class="data-label">Services Provided</td>
            <td class="data-value">{{ $app->organisation_details['services'] ?? 'Not specified' }}</td>
        </tr>
        <tr>
            <td class="data-label">Regions / Districts Served</td>
            <td class="data-value">{{ $app->organisation_details['regions'] ?? 'Not specified' }}</td>
        </tr>
        <tr>
            <td class="data-label">Parent or Corporate Group</td>
            <td class="data-value">{{ $app->organisation_details['parent_group'] ?? 'Independent' }}</td>
        </tr>
    </table>

    <!-- 3. Regulatory & Compliance -->
    <div class="section-title">3. Compliance & Telecom Licensing</div>
    <table class="data-table">
        <tr>
            <td class="data-label">PDPO Registration Status</td>
            <td class="data-value">
                {{ $app->pdpo_status }}
                @if(!empty($app->compliance_details['pdpo_reference']))
                    (Ref: {{ $app->compliance_details['pdpo_reference'] }}, Validity: {{ $app->compliance_details['pdpo_validity'] ?? 'N/A' }})
                @endif
                @if(!empty($app->compliance_details['pdpo_explanation']))
                    <br><em>Explanation: {{ $app->compliance_details['pdpo_explanation'] }}</em>
                @endif
            </td>
        </tr>
        <tr>
            <td class="data-label">Telecom Licence Relevance</td>
            <td class="data-value">{{ $app->licence_relevant }}</td>
        </tr>
        @if($app->licence_relevant === 'Yes')
        <tr>
            <td class="data-label">Licence Entry 1</td>
            <td class="data-value">
                <strong>Type:</strong> {{ $app->compliance_details['licence_type'] ?? 'N/A' }} |
                <strong>Status:</strong> {{ $app->compliance_details['licence_status'] ?? 'N/A' }} |
                <strong>No:</strong> {{ $app->compliance_details['licence_number'] ?? 'N/A' }}<br>
                <strong>Holder:</strong> {{ $app->compliance_details['licence_holder'] ?? 'N/A' }} |
                <strong>Validity:</strong> {{ $app->compliance_details['licence_validity'] ?? 'N/A' }}
            </td>
        </tr>
        @if(!empty($app->compliance_details['licence_type_2']))
        <tr>
            <td class="data-label">Licence Entry 2</td>
            <td class="data-value">
                <strong>Type:</strong> {{ $app->compliance_details['licence_type_2'] }} |
                <strong>Status:</strong> {{ $app->compliance_details['licence_status_2'] }} |
                <strong>No:</strong> {{ $app->compliance_details['licence_number_2'] }}<br>
                <strong>Holder:</strong> {{ $app->compliance_details['licence_holder_2'] }}
            </td>
        </tr>
        @endif
        @endif
        <tr>
            <td class="data-label">Operating Restrictions</td>
            <td class="data-value">
                {{ $app->restrictions['has_restrictions'] ?? 'No' }}
                @if(!empty($app->restrictions['restriction_details']))
                    <br><em>Details: {{ $app->restrictions['restriction_details'] }}</em>
                @endif
            </td>
        </tr>
    </table>

    <!-- 4. Key Contacts -->
    <div class="section-title">4. Personnel & Authorized Representatives</div>
    <table class="data-table">
        <tr>
            <td class="data-label">Primary Applicant</td>
            <td class="data-value">
                <strong>{{ $app->applicant_name }}</strong> ({{ $app->applicant_role }})<br>
                Email: {{ $app->applicant_email }} | Phone: {{ $app->applicant_phone }}
            </td>
        </tr>
        <tr>
            <td class="data-label">Authorized Representative</td>
            <td class="data-value">
                <strong>{{ $app->representative_name }}</strong> ({{ $app->representative_role }})<br>
                Email: {{ $app->representative_email }} | Phone: {{ $app->representative_phone }}
                @if(!empty($app->applicant_details['same_representative']))
                    <br><em>(Confirmed as same individual as primary applicant)</em>
                @endif
            </td>
        </tr>
        @if(!empty($app->applicant_details['alternate_representative']))
        <tr>
            <td class="data-label">Alternate Representative</td>
            <td class="data-value">{{ $app->applicant_details['alternate_representative'] }}</td>
        </tr>
        @endif
        <tr>
            <td class="data-label">Billing Contact</td>
            <td class="data-value">
                <strong>{{ $app->billing_contact }}</strong> | Email: {{ $app->billing_email }}<br>
                Invoice Address: {{ $app->invoice_address }}<br>
                TIN: {{ $app->billing_details['tin'] ?? 'N/A' }} | PO Ref: {{ $app->billing_details['purchase_order'] ?? 'N/A' }}
            </td>
        </tr>
    </table>

    <!-- 5. Supporting Documents -->
    <div class="section-title">5. Uploaded Evidence Documents</div>
    <table class="data-table">
        @php
            $attachments = $app->attachments ?? [];
        @endphp
        @if(count($attachments) > 0)
            @foreach($attachments as $key => $path)
                <tr>
                    <td class="data-label">{{ ucwords(preg_replace('/(?<!\ )[A-Z]/', ' $0', $key)) }}</td>
                    <td class="data-value">
                        <span class="check-yes">[ATTACHED]</span> {{ basename($path) }} (<code>{{ $path }}</code>)
                    </td>
                </tr>
            @endforeach
        @else
            <tr>
                <td colspan="2" class="data-value" style="color: #6c5960; text-align: center;">No attachments recorded.</td>
            </tr>
        @endif
    </table>

    <!-- 6. Declarations -->
    <div class="section-title">6. Statutory & Membership Declarations</div>
    <table class="data-table">
        @php
            $declarations = $app->declarations ?? [];
        @endphp
        <tr>
            <td class="data-label">Accuracy of Information</td>
            <td class="data-value">{!! !empty($declarations['accuracy']) ? '<span class="check-yes">[CONFIRMED]</span> Accepted and declared true.' : '<span class="check-no">[NOT ACCEPTED]</span>' !!}</td>
        </tr>
        <tr>
            <td class="data-label">Authority to Apply</td>
            <td class="data-value">{!! !empty($declarations['authority']) ? '<span class="check-yes">[CONFIRMED]</span> Authorized on behalf of the entity.' : '<span class="check-no">[NOT ACCEPTED]</span>' !!}</td>
        </tr>
        <tr>
            <td class="data-label">Rules, Code & Fees</td>
            <td class="data-value">{!! !empty($declarations['rules']) ? '<span class="check-yes">[CONFIRMED]</span> ISPAU Rules and Code of Conduct accepted.' : '<span class="check-no">[NOT ACCEPTED]</span>' !!}</td>
        </tr>
        <tr>
            <td class="data-label">Privacy Notice (v4.0)</td>
            <td class="data-value">{!! !empty($declarations['privacy']) ? '<span class="check-yes">[CONFIRMED]</span> Acknowledged.' : '<span class="check-no">[NOT ACCEPTED]</span>' !!}</td>
        </tr>
        <tr>
            <td class="data-label">Directory Consent</td>
            <td class="data-value">{!! !empty($declarations['directory']) ? '<span class="check-yes">[YES]</span> Approved public directory listing.' : '<span class="check-no">[NO]</span>' !!}</td>
        </tr>
    </table>

    <div class="footer-note">
        This document is an official summary generated by the ISPAU Membership Portal for review, auditing, and secretariat records.
    </div>

</body>
</html>
