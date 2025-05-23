import express from 'express';
import { sendTestEmail, sendTemplateEmail } from '../controllers/emailController';
import { sendWelcomeEmailsToAllUsers } from '../../scripts/sendWelcomeEmails';

const router = express.Router();

// Test send endpoint
router.post('/test', sendTestEmail);

// Template send endpoint
router.post('/template', sendTemplateEmail);

// Send welcome emails to all users
router.post('/send-welcome-emails', async (req, res) => {
  try {
    // Start the process in the background
    sendWelcomeEmailsToAllUsers()
      .then(() => {
        console.log('Welcome email sending process completed');
      })
      .catch((error) => {
        console.error('Error in welcome email sending process:', error);
      });

    // Immediately return a response
    return res.status(200).json({
      success: true,
      message: 'Welcome email sending process started. Check the server logs for progress.'
    });
  } catch (error) {
    console.error('Error starting welcome email process:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start welcome email process'
    });
  }
});

export default router; 