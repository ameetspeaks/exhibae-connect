const cron = require('node-cron');
const { checkAndSendReminders } = require('./tasks/exhibitionReminders');

// Schedule exhibition reminders to run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled exhibition reminder check...');
  await checkAndSendReminders();
});

// Export scheduler for use in main application
module.exports = {
  start: () => {
    console.log('Starting scheduled tasks...');
  }
}; 