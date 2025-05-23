# ExhiBae Comprehensive Deployment Script
param (
    [switch]$SkipBuild = $false
)

# Configuration
$SERVER = "69.62.77.142"
$SERVER_USER = "root"
$REMOTE_PATH = "/var/www/exhibae"
$BACKUP_DIR = "/var/www/exhibae_backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "=== ExhiBae Deployment Script ===" -ForegroundColor Cyan

# 1. Clean and build if not skipped
if (-not $SkipBuild) {
    Write-Host "Step 1: Cleaning and building application..." -ForegroundColor Green
    
    # Clean previous build
    if (Test-Path "dist") {
        Write-Host "  Removing previous build..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force dist
    }
    
    # Set production environment
    $env:NODE_ENV = "production"
    
    # Build the application
    Write-Host "  Building application with production settings..." -ForegroundColor Yellow
    npm run build
    
    if (-not (Test-Path "dist")) {
        Write-Host "Build failed! No dist directory found." -ForegroundColor Red
        exit 1
    }
    
    # Copy .htaccess if it's not already in dist
    if (-not (Test-Path "dist\.htaccess")) {
        Write-Host "  Copying .htaccess to dist..." -ForegroundColor Yellow
        Copy-Item -Path ".htaccess" -Destination "dist\"
    }
    
    Write-Host "  Build completed successfully." -ForegroundColor Green
} else {
    Write-Host "Step 1: Build skipped as requested." -ForegroundColor Yellow
}

# 2. Create deployment package
Write-Host "Step 2: Creating deployment package..." -ForegroundColor Green
Compress-Archive -Path "dist\*" -DestinationPath "deploy.zip" -Force

# 3. Upload to server
Write-Host "Step 3: Uploading to server..." -ForegroundColor Green

# Copy deployment files
Write-Host "  Uploading deployment zip..." -ForegroundColor Yellow
scp deploy.zip ${SERVER_USER}@${SERVER}:/tmp/

# Copy environment file if needed
Write-Host "  Uploading environment file..." -ForegroundColor Yellow
scp .env.production ${SERVER_USER}@${SERVER}:/tmp/deploy-env

# 4. Create and upload verification scripts
Write-Host "Step 4: Creating verification scripts..." -ForegroundColor Green

# Create server-side deployment script
$deployScript = @"
#!/bin/bash
echo "Starting server-side deployment..."

# Backup existing files
if [ -d $REMOTE_PATH ]; then
    mkdir -p $BACKUP_DIR
    echo "Creating backup in $BACKUP_DIR/backup_$TIMESTAMP..."
    cp -r $REMOTE_PATH $BACKUP_DIR/backup_$TIMESTAMP
fi

# Preserve existing .env if it exists
if [ -f $REMOTE_PATH/.env ]; then
    cp $REMOTE_PATH/.env /tmp/env.backup
fi

# Extract new version
echo "Extracting new version..."
unzip -o /tmp/deploy.zip -d $REMOTE_PATH

# Restore .env from backup or use deploy-env
if [ -f /tmp/env.backup ]; then
    cp /tmp/env.backup $REMOTE_PATH/.env
    echo "Restored existing .env file"
else
    cp /tmp/deploy-env $REMOTE_PATH/.env
    echo "Created new .env file from deployment package"
fi

# Set proper permissions
echo "Setting permissions..."
chown -R www-data:www-data $REMOTE_PATH
chmod -R 755 $REMOTE_PATH
find $REMOTE_PATH -type d -exec chmod 755 {} \;
find $REMOTE_PATH -type f -exec chmod 644 {} \;

# Cleanup old backups (keep last 5)
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs -r rm -rf

# Restart Apache
systemctl restart apache2

echo "Server-side deployment completed!"
"@

$verifyScript = @"
#!/bin/bash

# Check that the index.html file exists and has the right content
if [ -f "$REMOTE_PATH/index.html" ]; then
    echo "Index file exists"
    grep -q "ExhiBae" $REMOTE_PATH/index.html && echo "Index content looks good" || echo "Index content missing expected text"
else
    echo "Index file missing!"
fi

# Check that JavaScript files exist
if [ -d "$REMOTE_PATH/assets/js" ]; then
    echo "JavaScript directory exists"
    ls -la $REMOTE_PATH/assets/js/*.js && echo "JavaScript files found" || echo "No JavaScript files found"
else
    echo "JavaScript directory missing!"
fi

# Check that CSS files exist
if [ -d "$REMOTE_PATH/assets" ]; then
    echo "Assets directory exists"
    ls -la $REMOTE_PATH/assets/*.css && echo "CSS files found" || echo "No CSS files found"
else
    echo "Assets directory missing!"
fi

# Make sure the .htaccess file exists
if [ -f "$REMOTE_PATH/.htaccess" ]; then
    echo ".htaccess file exists"
else
    echo ".htaccess file missing!"
fi

# Check Apache configuration
echo "Checking Apache configuration"
apache2ctl -t 2>&1 | grep -q "Syntax OK" && echo "Apache configuration is valid" || echo "Apache configuration has errors"

# Check required Apache modules
echo "Checking required Apache modules"
apache2ctl -M 2>/dev/null | grep -q "rewrite_module" && echo "rewrite_module is enabled" || echo "rewrite_module is not enabled"
apache2ctl -M 2>/dev/null | grep -q "headers_module" && echo "headers_module is enabled" || echo "headers_module is not enabled"

echo "Verification complete. Please check https://exhibae.com in your browser to verify the site is working correctly."
"@

# Write scripts to temporary files
$deployScript | Out-File -FilePath "deploy-server.sh" -Encoding utf8
$verifyScript | Out-File -FilePath "verify-server.sh" -Encoding utf8

# Upload scripts
Write-Host "  Uploading deployment scripts..." -ForegroundColor Yellow
scp deploy-server.sh ${SERVER_USER}@${SERVER}:/tmp/
scp verify-server.sh ${SERVER_USER}@${SERVER}:/tmp/

# 5. Execute deployment on server
Write-Host "Step 5: Executing deployment on server..." -ForegroundColor Green
ssh ${SERVER_USER}@${SERVER} "chmod +x /tmp/deploy-server.sh && /tmp/deploy-server.sh"

# 6. Verify deployment
Write-Host "Step 6: Verifying deployment..." -ForegroundColor Green
ssh ${SERVER_USER}@${SERVER} "chmod +x /tmp/verify-server.sh && /tmp/verify-server.sh"

# 7. Cleanup local files
Write-Host "Step 7: Cleaning up local temporary files..." -ForegroundColor Green
Remove-Item -Path "deploy.zip" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "deploy-server.sh" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "verify-server.sh" -Force -ErrorAction SilentlyContinue

Write-Host "=== Deployment completed successfully! ===" -ForegroundColor Cyan
Write-Host "Please verify that the site is working correctly by visiting https://exhibae.com" -ForegroundColor Green 