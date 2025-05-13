#!/bin/bash

# Configuration
DEPLOY_PATH="/var/www/exhibae"
BACKUP_DIR="/var/www/exhibae_backups"
SERVER="deployer@69.62.77.142"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create a temporary directory for deployment
echo "Preparing deployment files..."
mkdir -p deploy_temp
cp -r dist/* deploy_temp/
cp .htaccess deploy_temp/ 2>/dev/null || echo "No .htaccess found"
cp .env.production deploy_temp/.env 2>/dev/null || echo "No .env.production found"

# Create backup directory on server
echo "Setting up backup directory..."
ssh $SERVER "mkdir -p $BACKUP_DIR"

# Backup current deployment
echo "Creating backup..."
ssh $SERVER "if [ -d $DEPLOY_PATH ]; then cp -r $DEPLOY_PATH ${BACKUP_DIR}/backup_${TIMESTAMP}; fi"

# Deploy using rsync
echo "Deploying files..."
rsync -avz --delete deploy_temp/ $SERVER:$DEPLOY_PATH/

# Set proper permissions
echo "Setting permissions..."
ssh $SERVER "sudo chown -R www-data:www-data $DEPLOY_PATH && sudo chmod -R 755 $DEPLOY_PATH && sudo chmod -R g+w $DEPLOY_PATH/assets"

# Cleanup
echo "Cleaning up..."
rm -rf deploy_temp

# Cleanup old backups (keep last 5)
echo "Cleaning up old backups..."
ssh $SERVER "cd $BACKUP_DIR && ls -t | tail -n +6 | xargs -r rm -rf"

echo "Deployment completed successfully!" 