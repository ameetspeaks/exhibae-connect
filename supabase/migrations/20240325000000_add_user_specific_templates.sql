-- Add new email templates for different user types
INSERT INTO public.email_templates (type, subject, template) VALUES
-- Organizer Templates
('organizer_exhibition_created', 'Your Exhibition Has Been Created', '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exhibition Created Successfully</title>
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
            <h1>Exhibition Created Successfully</h1>
        </div>
        <div class="content">
            <p>Dear {{organizer_name}},</p>
            <p>Your exhibition has been successfully created and is now live on ExhiBae!</p>
            <div class="exhibition-details">
                <h2>{{exhibition_title}}</h2>
                <p><strong>Date:</strong> {{exhibition_date}}</p>
                <p><strong>Location:</strong> {{exhibition_location}}</p>
                <p><strong>Category:</strong> {{exhibition_category}}</p>
                <p><strong>Total Stalls:</strong> {{total_stalls}}</p>
                <p><strong>Available Stalls:</strong> {{available_stalls}}</p>
            </div>
            <p>You can manage your exhibition through your organizer dashboard.</p>
            <a href="{{dashboard_link}}" class="button">Manage Exhibition</a>
            <p>Need help? Check out our organizer guide or contact support.</p>
        </div>
        <div class="footer">
            <p>© 2024 ExhiBae. All rights reserved.</p>
            <p>If you have any questions, please contact us at support@exhibae.com</p>
        </div>
    </div>
</body>
</html>'),

('organizer_new_application', 'New Stall Application Received', '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Stall Application</title>
    <style>
        /* Include base styles */
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
        .application-details {
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
            <h1>New Stall Application</h1>
        </div>
        <div class="content">
            <p>Dear {{organizer_name}},</p>
            <p>A new stall application has been received for your exhibition.</p>
            <div class="application-details">
                <h2>Application Details</h2>
                <p><strong>Brand Name:</strong> {{brand_name}}</p>
                <p><strong>Exhibition:</strong> {{exhibition_title}}</p>
                <p><strong>Stall Type:</strong> {{stall_type}}</p>
                <p><strong>Requested Stall:</strong> {{stall_number}}</p>
                <p><strong>Application Date:</strong> {{application_date}}</p>
                <p><strong>Brand Description:</strong> {{brand_description}}</p>
            </div>
            <p>Please review this application at your earliest convenience.</p>
            <a href="{{review_link}}" class="button">Review Application</a>
        </div>
        <div class="footer">
            <p>© 2024 ExhiBae. All rights reserved.</p>
            <p>If you have any questions, please contact us at support@exhibae.com</p>
        </div>
    </div>
</body>
</html>'),

-- Brand Templates
('brand_welcome', 'Welcome to ExhiBae!', '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ExhiBae</title>
    <style>
        /* Include base styles */
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ExhiBae!</h1>
        </div>
        <div class="content">
            <p>Dear {{brand_name}},</p>
            <p>Welcome to ExhiBae! We''re excited to have you join our community of brands and organizers.</p>
            <p>Here''s what you can do next:</p>
            <ul>
                <li>Complete your brand profile</li>
                <li>Browse upcoming exhibitions</li>
                <li>Apply for exhibition stalls</li>
                <li>Connect with organizers</li>
            </ul>
            <a href="{{profile_link}}" class="button">Complete Your Profile</a>
            <p>Need help getting started? Check out our brand guide or contact support.</p>
        </div>
        <div class="footer">
            <p>© 2024 ExhiBae. All rights reserved.</p>
            <p>If you have any questions, please contact us at support@exhibae.com</p>
        </div>
    </div>
</body>
</html>'),

-- Shopper Templates
('shopper_exhibition_reminder', 'Upcoming Exhibition Reminder', '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exhibition Reminder</title>
    <style>
        /* Include base styles */
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
            <h1>Exhibition Reminder</h1>
        </div>
        <div class="content">
            <p>Dear {{shopper_name}},</p>
            <p>Don''t forget about the upcoming exhibition you''re interested in!</p>
            <div class="exhibition-details">
                <h2>{{exhibition_title}}</h2>
                <p><strong>Date:</strong> {{exhibition_date}}</p>
                <p><strong>Time:</strong> {{exhibition_time}}</p>
                <p><strong>Location:</strong> {{exhibition_location}}</p>
                <p><strong>Featured Brands:</strong> {{featured_brands}}</p>
            </div>
            <p>Get your tickets now to secure your spot!</p>
            <a href="{{ticket_link}}" class="button">Get Tickets</a>
            <p>Share this exhibition with your friends and family!</p>
        </div>
        <div class="footer">
            <p>© 2024 ExhiBae. All rights reserved.</p>
            <p>If you have any questions, please contact us at support@exhibae.com</p>
        </div>
    </div>
</body>
</html>'); 