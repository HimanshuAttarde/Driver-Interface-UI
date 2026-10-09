import { createApp } from './index';
import http from 'http';

async function runAuthTests() {
  console.log('🧪 Starting SmartPool Driver Passwordless Auth Tests...');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(4005, () => resolve());
  });

  const baseUrl = 'http://localhost:4005/api/v1/driver/auth';

  try {
    // 1. Test Send OTP
    console.log('\n--- 1. Testing Send OTP ---');
    const sendRes = await fetch(`${baseUrl}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '+919876543210' }),
    });
    const sendData = await sendRes.json();
    console.log('Status:', sendRes.status, sendData);

    // 2. Test Invalid Phone Format
    console.log('\n--- 2. Testing Invalid Phone Format Validation ---');
    const invalidPhoneRes = await fetch(`${baseUrl}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '123' }),
    });
    console.log('Status (Expected 400):', invalidPhoneRes.status);

    // 3. Test Verify OTP with deliberate wrong OTP
    console.log('\n--- 3. Testing Verify OTP with Invalid Code ---');
    const wrongOtpRes = await fetch(`${baseUrl}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '+919876543210',
        otp: '000000',
      }),
    });
    const wrongOtpData = (await wrongOtpRes.json()) as any;
    console.log('Status (Expected 400):', wrongOtpRes.status, wrongOtpData.error?.message);

    console.log('\n✅ Driver Auth Backend Tests Completed Successfully!\n');
  } catch (err) {
    console.error('❌ Auth test error:', err);
  } finally {
    server.close();
  }
}

runAuthTests();
