# PowerShell script using direct .NET classes for SMTP

# SMTP Configuration
$smtpServer = "smtp.hostinger.com"
$smtpPort = 465  # Try with 465 (SSL)
$smtpUser = "hi@sportsvani.in"
Write-Host "Enter your SMTP password:" -ForegroundColor Yellow
$smtpPass = Read-Host
$fromAddress = "hi@sportsvani.in"

# Main script
Write-Host "===== EXHIBAE EMAIL TEST (Direct .NET) =====" -ForegroundColor Cyan
Write-Host "This script will test sending an email using direct .NET classes."
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
$subject = "Test Email from ExhiBae (Direct .NET)"
$body = @"
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333; text-align: center;">ExhiBae Connect</h1>
    <p>$greeting</p>
    <p>This is a test email from ExhiBae Connect using direct .NET classes. We're testing our new email system to ensure you receive important notifications.</p>
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
    
    # Create mail message
    $message = New-Object System.Net.Mail.MailMessage
    $message.From = New-Object System.Net.Mail.MailAddress($fromAddress, "ExhiBae")
    $message.To.Add($recipient)
    $message.Subject = $subject
    $message.Body = $body
    $message.IsBodyHtml = $true
    
    # Create SMTP client with SSL
    $smtp = New-Object System.Net.Mail.SmtpClient($smtpServer, $smtpPort)
    $smtp.EnableSsl = $true
    $smtp.Credentials = New-Object System.Net.NetworkCredential($smtpUser, $smtpPass)
    
    # Set timeout to 30 seconds
    $smtp.Timeout = 30000
    
    # Send email
    $smtp.Send($message)
    
    Write-Host "Email sent successfully to $recipient!" -ForegroundColor Green
}
catch {
    Write-Host "Error sending email: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`nLet's try with port 587 instead..." -ForegroundColor Yellow
    
    try {
        # Try again with port 587
        $smtpPort = 587
        Write-Host "Attempting with SMTP Port: $smtpPort" -ForegroundColor Yellow
        
        # Create SMTP client with TLS
        $smtp = New-Object System.Net.Mail.SmtpClient($smtpServer, $smtpPort)
        $smtp.EnableSsl = $true
        $smtp.Credentials = New-Object System.Net.NetworkCredential($smtpUser, $smtpPass)
        
        # Set timeout to 30 seconds
        $smtp.Timeout = 30000
        
        # Send email
        $smtp.Send($message)
        
        Write-Host "Email sent successfully to $recipient using port 587!" -ForegroundColor Green
    }
    catch {
        Write-Host "Error sending email with port 587: $($_.Exception.Message)" -ForegroundColor Red
        
        Write-Host "`nTroubleshooting tips:" -ForegroundColor Yellow
        Write-Host "1. Check if the SMTP server (smtp.hostinger.com) is correct"
        Write-Host "2. Verify that ports 465 and 587 are not blocked by your firewall"
        Write-Host "3. Make sure your email password is correct"
        Write-Host "4. Try using a different email provider or SMTP server"
        Write-Host "5. Contact Hostinger support to confirm SMTP settings"
    }
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 