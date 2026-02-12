# SMS Notification Setup Guide

This guide will help you set up SMS notifications for the Daily Forge app using Twilio.

## 🚀 Quick Start

### 1. Create a Twilio Account

1. Go to [twilio.com](https://www.twilio.com) and sign up for a free account
2. Verify your phone number during signup
3. You'll get $15 in free credits for development

### 2. Get Your Twilio Credentials

1. Go to your [Twilio Console Dashboard](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the main dashboard
3. Go to **Phone Numbers** → **Manage** → **Active numbers**
4. Buy a phone number (free with trial account) or use the trial number

### 3. Set Environment Variables

Create a `.env` file in the `server/` directory with your Twilio credentials:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Test phone number (your personal number for testing)
TEST_PHONE_NUMBER=+1234567890
```

### 4. Test the SMS Service

Run the test script to verify everything is working:

```bash
cd server
node test_sms.cjs
```

## 📱 Features

### Daily Inspirational Messages
- **Warrior-themed messages** to help you "stand firm and fight like a man"
- **Bible verses** about courage, strength, and spiritual growth
- **Personalized greetings** using your display name
- **Scheduled delivery** at your chosen time

### Message Examples
```
Good morning, David! 🌅

Rise up, warrior! Today is your day to stand firm and fight like a man. God has equipped you for this battle. 💪

📖 1 Corinthians 16:13 - 'Be on your guard; stand firm in the faith; be courageous; be strong.'

Time for your Daily Forge! 💪

Reply STOP to unsubscribe.
```

### User Settings
- **Phone number** management with validation
- **Notification time** selection (default: 7:00 AM)
- **Timezone** support (Eastern, Central, Mountain, Pacific)
- **Enable/disable** notifications
- **Test messages** to verify setup

## 🔧 API Endpoints

### Get SMS Settings
```
GET /api/user/sms-settings
```

### Update SMS Settings
```
PUT /api/user/sms-settings
{
  "phoneNumber": "+1234567890",
  "smsNotificationsEnabled": true,
  "notificationTime": "07:00",
  "timezone": "America/New_York",
  "notificationFrequency": "daily"
}
```

### Send Test Message
```
POST /api/user/sms-test
{
  "phoneNumber": "+1234567890"
}
```

### Send Daily Inspiration
```
POST /api/user/sms-daily
{
  "phoneNumber": "+1234567890"
}
```

### Get Notification Logs
```
GET /api/user/notification-logs?limit=10
```

## ⏰ Automatic Scheduling

The notification scheduler runs automatically and:
- **Checks every minute** for users who should receive notifications
- **Respects timezones** and notification times
- **Prevents duplicate** messages on the same day
- **Logs all activity** for debugging and monitoring
- **Handles errors gracefully** with retry logic

## 🧪 Testing

### 1. Test with Your Phone Number
```bash
# Set your phone number in the environment
export TEST_PHONE_NUMBER="+1234567890"

# Run the test script
cd server
node test_sms.cjs
```

### 2. Test via Frontend
1. Go to `/settings` in the app
2. Enter your phone number
3. Click "Send Test Message"
4. Check your phone for the message

### 3. Test Daily Messages
1. In settings, click "Send Daily Inspiration"
2. You'll receive a full daily message with Bible verse

## 📊 Monitoring

### Notification Logs
- View all sent messages in the settings page
- See delivery status (sent/failed)
- Check error messages for troubleshooting
- Track Twilio message IDs

### Database Tables
- `user_settings` - User SMS preferences
- `notification_logs` - Message delivery history

## 🚨 Troubleshooting

### Common Issues

**1. "Twilio not configured" message**
- Check your `.env` file has all required variables
- Verify the values are correct (no extra spaces)

**2. "Invalid phone number" error**
- Use E.164 format: +1234567890
- Include country code (1 for US)

**3. Messages not sending**
- Check your Twilio account balance
- Verify your phone number is verified in Twilio
- Check the notification logs for error details

**4. Messages not arriving**
- Check your phone's spam folder
- Verify the phone number format
- Test with a different phone number

### Debug Mode
The SMS service runs in "mock mode" when Twilio isn't configured, logging messages instead of sending them.

## 💰 Costs

### Twilio Pricing (as of 2024)
- **US SMS**: ~$0.0075 per message
- **Free trial**: $15 credit (≈2000 messages)
- **Monthly costs**: Very low for typical usage

### Cost Optimization
- Messages are only sent to users who opt-in
- Duplicate messages are prevented
- Old logs are cleaned up automatically

## 🔒 Security & Privacy

- **Phone numbers** are stored securely in the database
- **Opt-in required** - users must explicitly enable notifications
- **Easy opt-out** - users can reply STOP or disable in settings
- **No spam** - only daily inspirational messages
- **Data retention** - logs are cleaned up after 90 days

## 🚀 Production Deployment

### Environment Variables for Production
```bash
# Required
TWILIO_ACCOUNT_SID=your_production_account_sid
TWILIO_AUTH_TOKEN=your_production_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional
NODE_ENV=production
```

### Vercel Deployment
1. Add environment variables in Vercel dashboard
2. Deploy the server functions
3. The scheduler will run automatically

### Monitoring in Production
- Set up Twilio webhooks for delivery status
- Monitor notification logs regularly
- Set up alerts for failed messages

## 📞 Support

If you need help:
1. Check the notification logs in the app
2. Run the test script to verify setup
3. Check Twilio console for account status
4. Review this guide for common issues

---

**Ready to inspire warriors daily! 💪⚔️**


