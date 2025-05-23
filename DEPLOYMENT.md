# Deployment Guide for ExhiBae

This guide outlines the steps to deploy updates to the ExhiBae production server.

## Prerequisites

- SSH access to the production server (root@69.62.77.142)
- Node.js and npm installed locally
- Access to the project repository

## Automated Deployment

The easiest way to deploy the application is using the provided PowerShell script:

```powershell
# Deploy with a fresh build
.\deploy-full.ps1

# Deploy without rebuilding (if you've already built the app)
.\deploy-full.ps1 -SkipBuild
```

The script handles:
1. Building the application with production settings
2. Creating a deployment package
3. Uploading to the production server
4. Setting proper permissions
5. Restarting the web server
6. Verifying the deployment

## Manual Deployment Steps

If you need to deploy manually, follow these steps:

1. **Prepare Environment Variables**
   - Ensure `.env.production` exists in your local project root with the following variables:
   ```env
   VITE_SUPABASE_URL=https://ulqlhjluytobqaviuswk.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscWxoamx1eXRvYnFhdml1c3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNDQ0MDcsImV4cCI6MjA2MjYyMDQwN30.wbslqPS_NHHvUr5GDXpSJI6ey4nXH1HWfFJxxWsK3TY
   VITE_APP_URL=https://exhibae.com
   VITE_API_URL=https://exhibae.com
   BASE_URL=https://exhibae.com
   ```

2. **Build the Application**
   ```bash
   # Set the environment to production
   $env:NODE_ENV="production"
   
   # Clean the previous build
   Remove-Item -Recurse -Force dist
   
   # Install dependencies (if needed)
   npm install

   # Build the application
   npm run build
   ```

3. **Upload to Production Server**
   ```bash
   # Create a deployment package
   Compress-Archive -Path "dist\*" -DestinationPath "deploy.zip" -Force
   
   # Upload the zip file
   scp deploy.zip root@69.62.77.142:/tmp/
   
   # Upload environment file if needed
   scp .env.production root@69.62.77.142:/tmp/deploy-env
   ```

4. **Deploy on Server**
   ```bash
   # SSH into the server
   ssh root@69.62.77.142
   
   # Extract the files
   unzip -o /tmp/deploy.zip -d /var/www/exhibae/
   
   # Set correct ownership and permissions
   chown -R www-data:www-data /var/www/exhibae/
   chmod -R 755 /var/www/exhibae/
   
   # Restart Apache
   systemctl restart apache2
   ```

5. **Verify Deployment**
   - Visit https://www.exhibae.com/ to verify the changes
   - Check browser console for any errors
   - Test critical functionality (login, navigation, etc.)

## Server Configuration Reference

- **Web Server**: Apache2
- **Document Root**: /var/www/exhibae/
- **Environment File Location**: /var/www/exhibae/.env

## Troubleshooting

1. **URL Construction Errors**
   - Check if environment variables are properly set in both local `.env.production` and server's `.env`
   - Verify that the build process completed successfully
   - Check Apache configuration and .htaccess file

2. **JavaScript Not Loading**
   - Make sure the build process completed with proper JavaScript files
   - Check the browser console for any errors
   - Verify that the index.html file has the correct references to JavaScript files

3. **Permission Issues**
   - Run the permission commands in step 4
   - Ensure Apache has read access to all files

4. **404 Errors**
   - Verify that the Apache configuration includes proper URL rewriting rules
   - Check if all assets were uploaded successfully
   - Ensure the .htaccess file is correctly set up

## Rollback Procedure

If issues occur after deployment:

1. SSH into the server
2. Restore from backup:
   ```bash
   # List available backups
   ls -la /var/www/exhibae_backups/
   
   # Restore the desired backup
   rm -rf /var/www/exhibae/*
   cp -r /var/www/exhibae_backups/backup_TIMESTAMP/* /var/www/exhibae/
   
   # Set proper permissions
   chown -R www-data:www-data /var/www/exhibae/
   chmod -R 755 /var/www/exhibae/
   
   # Restart Apache
   systemctl restart apache2
   ```

## Notes

- Always build with production environment variables
- Test the build locally before deploying
- Monitor the server logs for any errors after deployment
- Keep track of successful deployments and any issues encountered 