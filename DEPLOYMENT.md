# Deployment Guide for ExhiBae

This guide outlines the steps to deploy updates to the ExhiBae production server.

## Prerequisites

- SSH access to the production server (root@69.62.77.142)
- Node.js and npm installed locally
- Access to the project repository

## Deployment Steps

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
   # Install dependencies (if needed)
   npm install

   # Build the application
   npm run build
   ```

3. **Upload to Production Server**
   ```bash
   # Upload the built files to the server
   scp -r dist/* root@69.62.77.142:/var/www/exhibae/
   ```

4. **Set Permissions on Server**
   ```bash
   # SSH into the server
   ssh root@69.62.77.142

   # Set correct ownership and permissions
   chown -R www-data:www-data /var/www/exhibae/
   chmod -R 755 /var/www/exhibae/
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

2. **Permission Issues**
   - Run the permission commands in step 4
   - Ensure Apache has read access to all files

3. **404 Errors**
   - Verify that the Apache configuration includes proper URL rewriting rules
   - Check if all assets were uploaded successfully

## Rollback Procedure

If issues occur after deployment:

1. Keep a backup of the previous working build
2. SSH into the server
3. Replace the current files with the backup
4. Set proper permissions again

## Notes

- Always build with production environment variables
- Test the build locally before deploying
- Monitor the server logs for any errors after deployment
- Keep track of successful deployments and any issues encountered 