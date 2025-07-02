import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== Environment Variables Debug ===');
console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI);

console.log('\n=== Email Configuration Check ===');
if (!process.env.SENDER_EMAIL || !process.env.EMAIL_PASSWORD) {
  console.log('❌ Email configuration missing:');
  console.log('  - SENDER_EMAIL:', process.env.SENDER_EMAIL ? '✅ Set' : '❌ Missing');
  console.log('  - EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
} else {
  console.log('✅ Email configuration found');
} 