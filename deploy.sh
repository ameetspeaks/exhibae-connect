#!/usr/bin/env bash

# Configuration
SERVER="69.62.77.142"
USER="root"
DEPLOY_PATH="/var/www/exhibae"
BACKUP_DIR="/var/www/exhibae_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Build the project
echo "Building project..."
npm run build

# Create deployment package
echo "Creating deployment package..."
rm -rf deploy_temp
mkdir -p deploy_temp
cp -r dist/* deploy_temp/
cp .htaccess deploy_temp/ 2>/dev/null || echo "No .htaccess found"
cp .env.production deploy_temp/.env 2>/dev/null || echo "No .env.production found"

# Create archive
cd deploy_temp
tar czf ../deploy.tar.gz .
cd ..

# Upload to server
echo "Uploading to server..."
scp -o StrictHostKeyChecking=no deploy.tar.gz root@${SERVER}:/tmp/

# Execute deployment
echo "Executing deployment..."
ssh -o StrictHostKeyChecking=no root@${SERVER} "
    set -e
    cd /tmp
    
    # Backup current deployment
    if [ -d $DEPLOY_PATH ]; then
        echo 'Creating backup...'
        mkdir -p $BACKUP_DIR
        cp -r $DEPLOY_PATH ${BACKUP_DIR}/backup_${TIMESTAMP}
    fi

    # Preserve existing .env if it exists
    if [ -f $DEPLOY_PATH/.env ]; then
        cp $DEPLOY_PATH/.env /tmp/env.temp
    fi

    # Extract new files
    rm -rf $DEPLOY_PATH/*
    cd $DEPLOY_PATH
    tar xzf /tmp/deploy.tar.gz

    # Restore .env if it was preserved
    if [ -f /tmp/env.temp ]; then
        mv /tmp/env.temp .env
    fi

    # Set proper permissions
    chown -R www-data:www-data .
    find . -type d -exec chmod 755 {} \;
    find . -type f -exec chmod 644 {} \;
    chmod -R g+w assets 2>/dev/null || true

    # Cleanup
    rm -f /tmp/deploy.tar.gz

    # Cleanup old backups (keep last 5)
    cd $BACKUP_DIR
    ls -t | tail -n +6 | xargs -r rm -rf

    echo 'Deployment completed successfully!'
"

# Cleanup local files
echo "Cleaning up local files..."
rm -rf deploy_temp deploy.tar.gz

echo "Deployment completed!" 