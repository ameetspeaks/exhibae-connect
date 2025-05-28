#!/bin/bash

# Set environment variables
export NODE_ENV=production
export VITE_SUPABASE_URL=https://ulqlhjluytobqaviuswk.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscWxoamx1eXRvYnFhdml1c3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNDQ0MDcsImV4cCI6MjA2MjYyMDQwN30.wbslqPS_NHHvUr5GDXpSJI6ey4nXH1HWfFJxxWsK3TY
export VITE_APP_URL=https://exhibae.com
export VITE_API_URL=https://exhibae.com
export BASE_URL=https://exhibae.com

# Install dependencies
npm install --legacy-peer-deps

# Build the application
npm run build

# Deploy to Apache directory
rm -rf /var/www/exhibae/*
cp -r dist/* /var/www/exhibae/

# Set permissions
chown -R www-data:www-data /var/www/exhibae/
chmod -R 755 /var/www/exhibae/

# Restart Apache
systemctl restart apache2

echo "Deployment completed!" 