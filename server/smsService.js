const twilio = require('twilio');
require('dotenv').config();

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// Inspirational messages and Bible verses for The Daily Forge
const inspirationalMessages = [
  {
    message: "Rise up, warrior! Today is your day to stand firm and fight like a man. God has equipped you for this battle. 💪",
    verse: "1 Corinthians 16:13 - 'Be on your guard; stand firm in the faith; be courageous; be strong.'"
  },
  {
    message: "Good morning, David! Time to put on your armor and face the day with courage. The Lord is your strength! ⚔️",
    verse: "Ephesians 6:10 - 'Finally, be strong in the Lord and in his mighty power.'"
  },
  {
    message: "Wake up, champion! Every day is a gift from God. Use it to grow stronger in faith and character. 🌅",
    verse: "Joshua 1:9 - 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.'"
  },
  {
    message: "Morning, warrior! Today you have the opportunity to be a man after God's own heart. Make it count! ❤️",
    verse: "1 Samuel 13:14 - 'The Lord has sought out a man after his own heart.'"
  },
  {
    message: "Rise and shine, David! Your daily discipline in God's Word will make you unshakeable. 📖",
    verse: "Psalm 1:2-3 - 'But whose delight is in the law of the Lord, and who meditates on his law day and night. That person is like a tree planted by streams of water.'"
  },
  {
    message: "Good morning! Today you choose to be a leader, not a follower. Lead with wisdom and integrity! 👑",
    verse: "Proverbs 4:7 - 'The beginning of wisdom is this: Get wisdom. Though it cost all you have, get understanding.'"
  },
  {
    message: "Wake up, mighty warrior! Your faithfulness in small things prepares you for great victories. 🏆",
    verse: "Luke 16:10 - 'Whoever can be trusted with very little can also be trusted with much.'"
  },
  {
    message: "Morning, David! Today you have the power to impact lives for eternity. Use it wisely! ✨",
    verse: "Matthew 5:16 - 'In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.'"
  },
  {
    message: "Rise up, leader! Your daily commitment to growth sets you apart. Keep pressing forward! 🚀",
    verse: "Philippians 3:14 - 'I press on toward the goal to win the prize for which God has called me heavenward in Christ Jesus.'"
  },
  {
    message: "Good morning, warrior! Today you choose courage over comfort, growth over complacency. 💪",
    verse: "2 Timothy 1:7 - 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.'"
  }
];

// Bible verses specifically about standing firm and fighting
const warriorVerses = [
  "Ephesians 6:13 - 'Therefore put on the full armor of God, so that when the day of evil comes, you may be able to stand your ground.'",
  "1 Corinthians 16:13 - 'Be on your guard; stand firm in the faith; be courageous; be strong.'",
  "Joshua 1:9 - 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.'",
  "2 Timothy 2:3 - 'Join with me in suffering, like a good soldier of Christ Jesus.'",
  "Ephesians 6:10 - 'Finally, be strong in the Lord and in his mighty power.'",
  "Psalm 18:39 - 'You armed me with strength for battle; you humbled my adversaries before me.'",
  "Isaiah 40:31 - 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.'",
  "2 Corinthians 10:4 - 'The weapons we fight with are not the weapons of the world. On the contrary, they have divine power to demolish strongholds.'",
  "1 Timothy 6:12 - 'Fight the good fight of the faith. Take hold of the eternal life to which you were called.'",
  "Psalm 144:1 - 'Praise be to the Lord my Rock, who trains my hands for war, my fingers for battle.'"
];

class SMSService {
  constructor() {
    this.isConfigured = !!(accountSid && authToken && twilioPhoneNumber);
    
    if (!this.isConfigured) {
      console.warn('⚠️  Twilio not configured. SMS notifications will be disabled.');
      console.warn('Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.');
    }
  }

  // Get a random inspirational message and verse
  getDailyMessage() {
    const randomMessage = inspirationalMessages[Math.floor(Math.random() * inspirationalMessages.length)];
    const randomVerse = warriorVerses[Math.floor(Math.random() * warriorVerses.length)];
    
    return {
      message: randomMessage.message,
      verse: randomVerse
    };
  }

  // Format phone number to E.164 format
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 1 and is 11 digits, it's already formatted
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it's 10 digits, assume US number and add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it already starts with +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // Default: assume US number
    return `+1${cleaned}`;
  }

  // Send SMS message
  async sendSMS(phoneNumber, message) {
    if (!this.isConfigured) {
      console.log('📱 [SMS MOCK] Would send to', phoneNumber, ':', message);
      return {
        success: true,
        sid: 'mock_sid_' + Date.now(),
        message: 'SMS service not configured - message logged only'
      };
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: formattedNumber
      });

      console.log('✅ SMS sent successfully:', result.sid);
      return {
        success: true,
        sid: result.sid,
        message: 'SMS sent successfully'
      };
    } catch (error) {
      console.error('❌ SMS send failed:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'SMS send failed'
      };
    }
  }

  // Send daily inspiration message
  async sendDailyInspiration(phoneNumber, userName = 'David') {
    const { message, verse } = this.getDailyMessage();
    
    const fullMessage = `Good morning, ${userName}! 🌅\n\n${message}\n\n📖 ${verse}\n\nTime for your Daily Forge! 💪\n\nReply STOP to unsubscribe.`;
    
    return await this.sendSMS(phoneNumber, fullMessage);
  }

  // Send test message
  async sendTestMessage(phoneNumber) {
    const testMessage = `🧪 Daily Forge Test Message\n\nThis is a test of the SMS notification system. If you received this, everything is working! 🎉\n\nReply STOP to unsubscribe.`;
    
    return await this.sendSMS(phoneNumber, testMessage);
  }

  // Send opt-in confirmation
  async sendOptInConfirmation(phoneNumber, userName = 'David') {
    const message = `✅ Welcome to Daily Forge SMS notifications, ${userName}!\n\nYou'll receive daily inspirational messages and Bible verses to help you stand firm and fight like a man. 💪\n\nMessages will be sent daily at your chosen time.\n\nReply STOP anytime to unsubscribe.`;
    
    return await this.sendSMS(phoneNumber, message);
  }

  // Send opt-out confirmation
  async sendOptOutConfirmation(phoneNumber) {
    const message = `You've been unsubscribed from Daily Forge SMS notifications. You can re-enable them anytime in your app settings.\n\nThank you for being part of The Daily Forge community! 🙏`;
    
    return await this.sendSMS(phoneNumber, message);
  }

  // Validate phone number format
  isValidPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}

module.exports = new SMSService();


