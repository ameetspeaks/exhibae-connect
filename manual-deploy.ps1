# Set environment to production
$env:NODE_ENV = "production"

# Clean install dependencies
Write-Host "Installing dependencies..."
Start-Process -Wait -NoNewWindow -FilePath "npm" -ArgumentList "ci"

# Build the application
Write-Host "Building application..."
Start-Process -Wait -NoNewWindow -FilePath "npm" -ArgumentList "run build"

# Create deployment package
Write-Host "Creating deployment package..."
Compress-Archive -Path "dist\*" -DestinationPath "deploy.zip" -Force

# Upload to server
Write-Host "Uploading to server..."
$server = "root@69.62.77.142"
$remotePath = "/var/www/exhibae/"

# Upload files
Start-Process -Wait -NoNewWindow -FilePath "scp" -ArgumentList "deploy.zip ${server}:/tmp/"

# Execute deployment commands
$deployCommands = @"
cd /tmp
unzip -o deploy.zip -d $remotePath
chown -R www-data:www-data $remotePath
chmod -R 755 $remotePath
systemctl restart apache2
rm deploy.zip
"@

$deployCommands | ssh $server 'bash -s'

Write-Host "Deployment completed. Please verify at https://exhibae.com" 