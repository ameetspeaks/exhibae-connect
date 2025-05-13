#!/bin/bash

# Configuration
SERVER_USER="your-server-username"
SERVER_HOST="your-server-hostname"
REMOTE_PATH="/path/to/your/web/root"

# Build the React application
echo "Building React application..."
npm run build

# Create deployment directory if it doesn't exist
echo "Creating deployment directory..."
mkdir -p deploy

# Copy build files to deployment directory
echo "Copying build files..."
cp -r dist/* deploy/
cp .htaccess deploy/

# Copy and rename environment file
echo "Setting up environment variables..."
cp .env.production deploy/.env

# Set proper permissions
echo "Setting file permissions..."
find deploy/ -type d -exec chmod 755 {} \;
find deploy/ -type f -exec chmod 644 {} \;

# Upload to server using rsync
echo "Uploading to server..."
rsync -avz --delete deploy/ $SERVER_USER@$SERVER_HOST:$REMOTE_PATH

# Clean up
echo "Cleaning up..."
rm -rf deploy

echo "Deployment complete!" 