import { testEmailConfig } from './test-email';

console.log('Starting email configuration test...');
testEmailConfig()
  .then(() => {
    console.log('Email test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Email test failed:', error);
    process.exit(1);
  }); 