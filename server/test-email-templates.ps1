# PowerShell script to test email templates
# This script tests sending emails with different templates directly from PowerShell

# SMTP Configuration
$smtpServer = "smtp.hostinger.com"
$smtpPort = 587  # Using port 587 with TLS
$smtpUser = "hi@sportsvani.in"
Write-Host "Enter your SMTP password:" -ForegroundColor Yellow
$smtpPass = Read-Host -AsSecureString
$fromAddress = "hi@sportsvani.in"

# Create credentials
$credential = New-Object System.Management.Automation.PSCredential($smtpUser, $smtpPass)

# Template data
$templates = @{
    welcome = @{
        subject = "Welcome to ExhiBae!"
        body = @"
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ExhiBae</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to ExhiBae!</h1>
  </div>
  <div class="content">
    <p>Hello {0},</p>
    <p>Thank you for joining ExhiBae. We're excited to have you on board!</p>
    <p>You can now start exploring exhibitions and connecting with brands.</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="https://exhibae.com/dashboard" class="button">Go to Dashboard</a>
    </p>
    <p>If you have any questions, feel free to contact our support team.</p>
    <p>Best regards,<br>The ExhiBae Team</p>
  </div>
  <div class="footer">
    <p>© 2023 ExhiBae. All rights reserved.</p>
    <p>If you wish to unsubscribe, <a href="https://exhibae.com/unsubscribe">click here</a>.</p>
  </div>
</body>
</html>
"@
    }
    application_status = @{
        subject = "Update on your ExhiBae application"
        body = @"
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Application Status Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .status { font-weight: bold; font-size: 18px; margin: 20px 0; padding: 10px; text-align: center; border-radius: 5px; }
    .approved { background-color: #dff0d8; color: #3c763d; }
    .pending { background-color: #fcf8e3; color: #8a6d3b; }
    .rejected { background-color: #f2dede; color: #a94442; }
    .button { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Application Status Update</h1>
  </div>
  <div class="content">
    <p>Dear {0},</p>
    <p>We have an update on your application for ExhiBae:</p>
    <div class="status approved">
      Your application status: <strong>Approved</strong>
    </div>
    <p>Congratulations! Your application has been approved. You can now access all features of ExhiBae.</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="https://exhibae.com/dashboard" class="button">View Details</a>
    </p>
    <p>If you have any questions, please contact our support team.</p>
    <p>Best regards,<br>The ExhiBae Team</p>
  </div>
  <div class="footer">
    <p>© 2023 ExhiBae. All rights reserved.</p>
    <p>If you wish to unsubscribe, <a href="https://exhibae.com/unsubscribe">click here</a>.</p>
  </div>
</body>
</html>
"@
    }
    password_reset = @{
        subject = "Reset your ExhiBae password"
        body = @"
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    .warning { color: #a94442; font-style: italic; }
    .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Password Reset</h1>
  </div>
  <div class="content">
    <p>Dear {0},</p>
    <p>We received a request to reset your password for your ExhiBae account.</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="https://exhibae.com/reset-password?token=abc123" class="button">Reset Password</a>
    </p>
    <p>This link will expire in 1 hour.</p>
    <p class="warning">If you did not request a password reset, please ignore this email or contact our support team if you have concerns.</p>
    <p>Best regards,<br>The ExhiBae Team</p>
  </div>
  <div class="footer">
    <p>© 2023 ExhiBae. All rights reserved.</p>
    <p>For security reasons, this email cannot be replied to.</p>
  </div>
</body>
</html>
"@
    }
}

# Main script
Write-Host "===== EXHIBAE EMAIL TEMPLATE TEST =====" -ForegroundColor Cyan
Write-Host "This script will test sending email templates."
Write-Host "SMTP Server: $smtpServer"
Write-Host "SMTP Port: $smtpPort"
Write-Host "SMTP User: $smtpUser"
Write-Host ""

# Get recipient email
$recipient = Read-Host "Enter recipient email address"
if ([string]::IsNullOrWhiteSpace($recipient)) {
    Write-Host "No recipient specified. Exiting..." -ForegroundColor Yellow
    exit
}

# Get recipient name
$name = Read-Host "Enter recipient name (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($name)) {
    $name = "User"
}

# Choose template
Write-Host "`nAvailable templates:" -ForegroundColor Cyan
$templates.Keys | ForEach-Object { Write-Host "- $_" }

$templateChoice = Read-Host "`nEnter template name (or 'all' to send all templates)"

# Function to send a template
function Send-Template {
    param (
        [string]$TemplateName,
        [string]$Recipient,
        [string]$Name
    )
    
    if (-not $templates.ContainsKey($TemplateName)) {
        Write-Host "Template '$TemplateName' not found" -ForegroundColor Red
        return $false
    }
    
    $template = $templates[$TemplateName]
    $subject = $template.subject
    $body = $template.body -f $Name
    
    try {
        Write-Host "Sending $TemplateName template to $Recipient..." -ForegroundColor Yellow
        
        # Send email
        Send-MailMessage -To $Recipient -From $fromAddress -Subject $subject -Body $body -BodyAsHtml -SmtpServer $smtpServer -Port $smtpPort -Credential $credential -UseSsl
        
        Write-Host "✅ Template $TemplateName sent successfully to $Recipient!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Error sending $TemplateName template: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Send templates
$results = @{
    Success = 0
    Failed = 0
}

if ($templateChoice -eq "all") {
    # Send all templates
    foreach ($templateName in $templates.Keys) {
        $success = Send-Template -TemplateName $templateName -Recipient $recipient -Name $name
        
        if ($success) {
            $results.Success++
        }
        else {
            $results.Failed++
        }
        
        # Wait a bit between emails
        Start-Sleep -Seconds 1
    }
}
else {
    # Send specific template
    $success = Send-Template -TemplateName $templateChoice -Recipient $recipient -Name $name
    
    if ($success) {
        $results.Success++
    }
    else {
        $results.Failed++
    }
}

# Print summary
Write-Host "`n===== EMAIL SENDING SUMMARY =====" -ForegroundColor Cyan
Write-Host "Total templates: $($results.Success + $results.Failed)"
Write-Host "Successful: $($results.Success)" -ForegroundColor Green
Write-Host "Failed: $($results.Failed)" -ForegroundColor Red

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 