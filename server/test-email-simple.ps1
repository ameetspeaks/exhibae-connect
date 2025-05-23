# Simple PowerShell script to test email sending using Send-MailMessage

# SMTP Configuration
$smtpServer = "smtp.hostinger.com"
$smtpPort = 465
$smtpUser = "hi@sportsvani.in"
Write-Host "Enter your SMTP password:" -ForegroundColor Yellow
$smtpPass = Read-Host -AsSecureString
$fromAddress = "hi@sportsvani.in"

# Create credentials
$credential = New-Object System.Management.Automation.PSCredential($smtpUser, $smtpPass)

# Main script
Write-Host "===== EXHIBAE EMAIL TEST =====" -ForegroundColor Cyan
Write-Host "This script will test sending an email using PowerShell's Send-MailMessage cmdlet."
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
$greeting = if ($name) { "Hello $name," } else { "Hello there," }

# Create email content
$subject = "Test Email from ExhiBae"
$body = @"
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333; text-align: center;">ExhiBae Connect</h1>
    <p>$greeting</p>
    <p>This is a test email from ExhiBae Connect. We're testing our new email system to ensure you receive important notifications.</p>
    <p>If you received this email, it means our system is working correctly.</p>
    <div style="margin: 30px 0; text-align: center;">
        <a href="https://exhibae.com" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px;">Visit ExhiBae</a>
    </div>
    <p>Thank you for being part of our community!</p>
    <p>Best regards,<br>The ExhiBae Team</p>
</body>
</html>
"@

# Try to send email
try {
    Write-Host "Sending email to $recipient..." -ForegroundColor Yellow
    
    # Send email
    Send-MailMessage -To $recipient -From $fromAddress -Subject $subject -Body $body -BodyAsHtml -SmtpServer $smtpServer -Port $smtpPort -UseSsl -Credential $credential
    
    Write-Host "Email sent successfully to $recipient!" -ForegroundColor Green
}
catch {
    Write-Host "Error sending email: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`nTroubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Check if the SMTP server (smtp.hostinger.com) is correct"
    Write-Host "2. Verify that port 465 is not blocked by your firewall"
    Write-Host "3. Make sure your email password is correct"
    Write-Host "4. Try using port 587 instead of 465 (modify the script)"
    Write-Host "5. Contact your email provider to confirm SMTP settings"
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 