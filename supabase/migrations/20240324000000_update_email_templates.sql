-- Update application status template
UPDATE public.email_templates
SET template = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Status Update</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: #6366f1;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 30px;
            color: #333333;
        }
        .footer {
            background: #f8f8f8;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666666;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #6366f1;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }
        .status {
            padding: 10px 20px;
            border-radius: 4px;
            display: inline-block;
            margin: 10px 0;
            font-weight: bold;
        }
        .status.approved { background-color: #10b981; color: white; }
        .status.pending { background-color: #f59e0b; color: white; }
        .status.rejected { background-color: #ef4444; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Application Status Update</h1>
        </div>
        <div class="content">
            <p>Dear {{brand_name}},</p>
            <p>Your application for <strong>{{exhibition_title}}</strong> has been updated.</p>
            <p>Current Status: <span class="status {{status_class}}">{{status}}</span></p>
            <div class="details">
                <p><strong>Exhibition:</strong> {{exhibition_title}}</p>
                <p><strong>Stall Number:</strong> {{stall_number}}</p>
                <p><strong>Application Date:</strong> {{application_date}}</p>
                {{#if payment_required}}
                <p><strong>Payment Amount:</strong> {{payment_amount}}</p>
                {{/if}}
            </div>
            {{#if comments}}
            <p><strong>Comments from Organizer:</strong></p>
            <p>{{comments}}</p>
            {{/if}}
            {{#if payment_required}}
            <p>Please complete your payment to secure your spot at the exhibition.</p>
            <a href="{{payment_link}}" class="button">Complete Payment</a>
            {{/if}}
            <p>You can view your application details and track its status on your dashboard.</p>
            <a href="{{dashboard_link}}" class="button">View Dashboard</a>
        </div>
        <div class="footer">
            <p>© 2024 Exhibae. All rights reserved.</p>
            <p>If you have any questions, please contact us at support@exhibae.com</p>
        </div>
    </div>
</body>
</html>'
WHERE type = 'application_received';

-- Update exhibition created template
UPDATE public.email_templates
SET template = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Exhibition Created</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: #6366f1;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 30px;
            color: #333333;
        }
        .footer {
            background: #f8f8f8;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666666;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #6366f1;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }
        .exhibition-details {
            background: #f8fafc;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Exhibition Announcement</h1>
        </div>
        <div class="content">
            <p>Dear {{brand_name}},</p>
            <p>We are excited to announce a new exhibition that might interest you!</p>
            <div class="exhibition-details">
                <h2>{{exhibition_title}}</h2>
                <p><strong>Date:</strong> {{exhibition_date}}</p>
                <p><strong>Location:</strong> {{exhibition_location}}</p>
                <p><strong>Category:</strong> {{exhibition_category}}</p>
                <p>{{exhibition_description}}</p>
            </div>
            <p>Don''t miss this opportunity to showcase your brand!</p>
            <a href="{{application_link}}" class="button">Apply Now</a>
            <p>Limited spots available. Apply early to secure your place.</p>
        </div>
        <div class="footer">
            <p>© 2024 Exhibae. All rights reserved.</p>
            <p>If you have any questions, please contact us at support@exhibae.com</p>
        </div>
    </div>
</body>
</html>'
WHERE type = 'exhibition_created'; 