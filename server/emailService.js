const nodemailer = require('nodemailer');

const supportEmail = process.env.SUPPORT_EMAIL || 'support@thedailyforge.com';

class EmailService {
  constructor() {
    this.isConfigured = !!(process.env.GMAIL_USER && process.env.GMAIL_PASS);
    
    if (!this.isConfigured) {
      console.log('⚠️  Email service not configured. Set GMAIL_USER and GMAIL_PASS environment variables.');
    } else {
      console.log('✅ Email service configured with Gmail SMTP');
    }
  }

  async sendSupportEmail({ userName, userEmail, subject, message, category }) {
    console.log('📧 Email service - isConfigured:', this.isConfigured);
    console.log('📧 Email service - GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'Not set');
    console.log('📧 Email service - GMAIL_PASS:', process.env.GMAIL_PASS ? 'Set' : 'Not set');
    console.log('📧 Email service - SUPPORT_EMAIL:', process.env.SUPPORT_EMAIL);
    
    if (!this.isConfigured) {
      console.log('📧 [EMAIL MOCK] Support request:', { userName, userEmail, subject, category });
      return { success: true, message: 'Email service not configured - message logged only' };
    }

    try {
      // Create Gmail SMTP transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: supportEmail,
        subject: `[${category.toUpperCase()}] ${subject}`,
        text: `New Support Request

From: ${userName} (${userEmail})
Category: ${category}
Subject: ${subject}

Message:
${message}

---
This support request was submitted via The Daily Forge app.
Reply directly to this email to respond to the user.`,
        replyTo: userEmail
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Support email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();

