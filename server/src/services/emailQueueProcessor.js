/**
 * Email Queue Processor
 * Handles processing of queued emails
 */

const emailService = require('./emailService');

/**
 * Process the email queue
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results
 */
async function processQueue(options = {}) {
  try {
    console.log('Processing email queue...');
    return await emailService.processEmailQueue();
  } catch (error) {
    console.error('Error processing email queue:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process scheduled emails
 * @returns {Promise<Object>} Processing results
 */
async function processScheduledEmails() {
  try {
    console.log('Processing scheduled emails...');
    // In a real implementation, this would fetch scheduled emails from database
    // For now, just return a success message
    return { 
      success: true,
      processed: 0,
      message: 'No scheduled emails to process'
    };
  } catch (error) {
    console.error('Error processing scheduled emails:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  processQueue,
  processScheduledEmails
}; 