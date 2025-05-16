# Configuration
$DEPLOY_PATH = "/var/www/exhibae"
$BACKUP_DIR = "/var/www/exhibae_backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$SERVER = "69.62.77.142"
$SERVER_USER = "root"
$SERVER_PASS = "Ameet@300921"

# Create a temporary directory for deployment
Write-Host "Preparing deployment files..."
New-Item -ItemType Directory -Force -Path "deploy_temp" | Out-Null
Copy-Item -Path "dist\*" -Destination "deploy_temp" -Recurse -Force
Copy-Item -Path ".htaccess" -Destination "deploy_temp" -ErrorAction SilentlyContinue
Copy-Item -Path ".env.production" -Destination "deploy_temp\.env" -ErrorAction SilentlyContinue

# Create deployment archive
Write-Host "Creating deployment archive..."
Compress-Archive -Path "deploy_temp\*" -DestinationPath "deploy.zip" -Force

# Upload using PSCP (requires PuTTY tools)
Write-Host "Uploading deployment archive..."
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
if (-not (Test-Path $pscpPath)) {
    Write-Host "PuTTY not found. Please install PuTTY and try again."
    exit 1
}

# Upload the file
& $pscpPath -pw $SERVER_PASS "deploy.zip" "${SERVER_USER}@${SERVER}:/tmp/"

# Execute remote commands using plink
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
if (-not (Test-Path $plinkPath)) {
    Write-Host "PuTTY not found. Please install PuTTY and try again."
    exit 1
}

$remoteCommands = @"
cd /tmp
unzip -o deploy.zip -d temp_deploy
if [ -d $DEPLOY_PATH ]; then
    echo 'Creating backup...'
    mkdir -p $BACKUP_DIR
    cp -r $DEPLOY_PATH ${BACKUP_DIR}/backup_${TIMESTAMP}
fi

# Preserve existing .env if it exists
if [ -f $DEPLOY_PATH/.env ]; then
    cp $DEPLOY_PATH/.env /tmp/env.temp
fi

# Deploy new version
echo 'Deploying new version...'
rm -rf $DEPLOY_PATH/*
cp -r temp_deploy/* $DEPLOY_PATH/

# Restore .env if it was preserved
if [ -f /tmp/env.temp ]; then
    mv /tmp/env.temp $DEPLOY_PATH/.env
fi

# Set proper permissions
chown -R www-data:www-data $DEPLOY_PATH
chmod -R 755 $DEPLOY_PATH
find $DEPLOY_PATH -type d -exec chmod 755 {} \;
find $DEPLOY_PATH -type f -exec chmod 644 {} \;
chmod -R g+w $DEPLOY_PATH/assets 2>/dev/null || true

# Cleanup
rm -rf temp_deploy
rm -f deploy.zip

# Cleanup old backups (keep last 5)
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs -r rm -rf

echo 'Deployment completed successfully!'
"@

Write-Host "Executing deployment on server..."
$remoteCommands | & $plinkPath -pw $SERVER_PASS "${SERVER_USER}@${SERVER}" "bash -s"

# Cleanup local files
Write-Host "Cleaning up local files..."
Remove-Item -Path "deploy_temp" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "deploy.zip" -Force -ErrorAction SilentlyContinue

Write-Host "Local deployment script completed!" 