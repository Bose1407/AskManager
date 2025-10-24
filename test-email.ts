// Quick test script to verify email configuration
import dotenv from 'dotenv';
dotenv.config();

import { sendEmail, emailTemplates } from './server/utils/email';

async function testEmail() {
  console.log('🧪 Testing email configuration...\n');
  
  const testRecipient = process.env.EMAIL_USER || 'your-email@gmail.com';
  
  console.log(`📧 Sending test email to: ${testRecipient}`);
  console.log(`   Using SMTP: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
  console.log(`   From: ${process.env.EMAIL_FROM}\n`);

  const template = emailTemplates.welcome('Test User', 'Company Manager');
  
  const result = await sendEmail({
    to: testRecipient,
    subject: template.subject,
    html: template.html,
  });

  if (result) {
    console.log('\n✅ SUCCESS! Email sent successfully!');
    console.log('   Check your inbox at:', testRecipient);
  } else {
    console.log('\n❌ FAILED! Could not send email.');
    console.log('   Please check:');
    console.log('   1. EMAIL_USER and EMAIL_PASSWORD are correct');
    console.log('   2. You are using App Password (not regular Gmail password)');
    console.log('   3. 2FA is enabled on your Gmail account');
  }
  
  process.exit(result ? 0 : 1);
}

testEmail().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
