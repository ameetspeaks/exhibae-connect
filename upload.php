<?php
// Basic authentication
if (!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW']) ||
    $_SERVER['PHP_AUTH_USER'] !== 'root' || $_SERVER['PHP_AUTH_PW'] !== 'Ameet@300921') {
    header('HTTP/1.0 401 Unauthorized');
    exit('Unauthorized');
}

// Check if file was uploaded
if (!isset($_FILES['file'])) {
    http_response_code(400);
    exit('No file uploaded');
}

$uploadedFile = $_FILES['file'];
$targetDir = '/var/www/exhibae/';
$backupDir = '/var/www/exhibae_backups/';
$timestamp = date('Ymd_His');

// Create backup
if (is_dir($targetDir)) {
    shell_exec("cp -r $targetDir {$backupDir}backup_{$timestamp}");
}

// Extract the uploaded zip file
$tempFile = $uploadedFile['tmp_name'];
shell_exec("unzip -o $tempFile -d $targetDir");

// Set proper permissions
shell_exec("chown -R www-data:www-data $targetDir");
shell_exec("chmod -R 755 $targetDir");
shell_exec("find $targetDir -type d -exec chmod 755 {} \\;");
shell_exec("find $targetDir -type f -exec chmod 644 {} \\;");

// Cleanup old backups (keep last 5)
shell_exec("cd $backupDir && ls -t | tail -n +6 | xargs -r rm -rf");

echo "Deployment successful!";
?> 