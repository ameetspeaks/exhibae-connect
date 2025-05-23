require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const emailRoutes = require('./routes/emailRoutes');
const emailService = require('./services/emailService');

// Create Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', process.env.CLIENT_URL || '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/email', emailRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'ExhiBae API Server', 
    version: '1.0.0',
    docs: '/docs'
  });
});

// Documentation endpoint
app.get('/docs', (req, res) => {
  res.json({
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check endpoint' },
      { method: 'GET', path: '/', description: 'Root endpoint with API information' },
      { method: 'GET', path: '/docs', description: 'API documentation' },
      { method: 'POST', path: '/api/email/send', description: 'Send an email' },
      { method: 'POST', path: '/api/email/template', description: 'Send an email using a template' },
      { method: 'POST', path: '/api/email/queue', description: 'Queue an email for later sending' },
      { method: 'POST', path: '/api/email/process-queue', description: 'Process the email queue' },
      { method: 'GET', path: '/api/email/templates', description: 'Get all available email templates' },
      { method: 'POST', path: '/api/email/verify', description: 'Verify SMTP connection' }
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error', 
    message: err.message 
  });
});

// Schedule email queue processing
function scheduleEmailQueueProcessing() {
  console.log('Scheduling email queue processing...');
  
  // Process email queue every 5 minutes
  setInterval(async () => {
    try {
      console.log('Processing email queue...');
      const result = await emailService.processEmailQueue();
      console.log('Email queue processing result:', result);
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// Verify email service on startup
async function verifyEmailService() {
  try {
    console.log('Verifying email service...');
    const connected = await emailService.verifyConnection();
    
    if (connected) {
      console.log('Email service verified successfully');
    } else {
      console.warn('Email service verification failed. Emails may not be sent.');
    }
  } catch (error) {
    console.error('Error verifying email service:', error);
  }
}

// Start server
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  
  // Verify email service
  await verifyEmailService();
  
  // Schedule email queue processing
  scheduleEmailQueueProcessing();
}); 