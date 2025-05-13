# Configuration
$DEPLOY_PATH = "/var/www/exhibae"
$BACKUP_DIR = "/var/www/exhibae_backups"
$SERVER = "deployer@69.62.77.142"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# Create a temporary directory for deployment
Write-Host "Preparing deployment files..."
New-Item -ItemType Directory -Force -Path "deploy_temp" | Out-Null
Copy-Item "dist\*" -Destination "deploy_temp" -Recurse -Force

if (Test-Path ".htaccess") {
    Copy-Item ".htaccess" -Destination "deploy_temp" -Force
} else {
    Write-Host "No .htaccess found"
}

if (Test-Path ".env.production") {
    Copy-Item ".env.production" -Destination "deploy_temp\.env" -Force
} else {
    Write-Host "No .env.production found"
}

# Create backup directory on server
Write-Host "Setting up backup directory..."
ssh $SERVER "mkdir -p $BACKUP_DIR"

# Backup current deployment
Write-Host "Creating backup..."
ssh $SERVER "if [ -d $DEPLOY_PATH ]; then cp -r $DEPLOY_PATH ${BACKUP_DIR}/backup_${TIMESTAMP}; fi"

# Deploy using scp (since rsync might not be available on Windows)
Write-Host "Deploying files..."
scp -r deploy_temp\* "$SERVER`:$DEPLOY_PATH/"

# Set proper permissions
Write-Host "Setting permissions..."
ssh $SERVER "sudo chown -R www-data:www-data $DEPLOY_PATH && sudo chmod -R 755 $DEPLOY_PATH && sudo chmod -R g+w $DEPLOY_PATH/assets"

# Cleanup
Write-Host "Cleaning up..."
Remove-Item -Path "deploy_temp" -Recurse -Force

# Cleanup old backups (keep last 5)
Write-Host "Cleaning up old backups..."
ssh $SERVER "cd $BACKUP_DIR && ls -t | tail -n +6 | xargs -r rm -rf"

Write-Host "Deployment completed successfully!" 