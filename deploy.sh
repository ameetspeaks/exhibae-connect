#!/bin/bash

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

echo "Deployment files are ready in the 'deploy' directory"
echo "Remember to:"
echo "1. Upload files to your server"
echo "2. Set proper environment variables"
echo "3. Restart Apache after deployment" 