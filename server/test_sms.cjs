const smsService = require('./smsService');
require('dotenv').config();

async function testSMS() {
  console.log('🧪 Testing SMS Service...\n');
  
  // Check if Twilio is configured
  if (!smsService.isConfigured) {
    console.log('⚠️  Twilio not configured. Running in mock mode.');
    console.log('To configure Twilio, set these environment variables:');
    console.log('- TWILIO_ACCOUNT_SID');
    console.log('- TWILIO_AUTH_TOKEN');
    console.log('- TWILIO_PHONE_NUMBER\n');
  }
  
  // Test phone number - replace with your actual phone number
  const testPhoneNumber = process.env.TEST_PHONE_NUMBER || '5551234567';
  
  console.log(`📱 Testing with phone number: ${testPhoneNumber}`);
  console.log(`📱 Formatted number: ${smsService.formatPhoneNumber(testPhoneNumber)}\n`);
  
  try {
    // Test 1: Send test message
    console.log('🧪 Test 1: Sending test message...');
    const testResult = await smsService.sendTestMessage(testPhoneNumber);
    console.log('Result:', testResult);
    console.log('');
    
    // Test 2: Send daily inspiration message
    console.log('🧪 Test 2: Sending daily inspiration message...');
    const dailyResult = await smsService.sendDailyInspiration(testPhoneNumber, 'David');
    console.log('Result:', dailyResult);
    console.log('');
    
    // Test 3: Test phone number validation
    console.log('🧪 Test 3: Testing phone number validation...');
    const validNumbers = [
      '5551234567',
      '15551234567',
      '+15551234567',
      '(555) 123-4567',
      '555-123-4567'
    ];
    
    validNumbers.forEach(num => {
      const isValid = smsService.isValidPhoneNumber(num);
      const formatted = smsService.formatPhoneNumber(num);
      console.log(`  ${num} -> Valid: ${isValid}, Formatted: ${formatted}`);
    });
    
    console.log('\n✅ SMS testing completed!');
    
  } catch (error) {
    console.error('❌ Error during SMS testing:', error);
  }
}

// Run the test
testSMS()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });


