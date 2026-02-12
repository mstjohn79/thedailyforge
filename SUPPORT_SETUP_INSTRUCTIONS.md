# Support Contact Form - Setup Instructions

## ✅ What's Been Completed

The support contact form has been fully implemented and deployed to GitHub. Here's what's ready:

### Backend
- ✅ Email service with Resend integration (`server/emailService.js`)
- ✅ Support API endpoint (`/api/support/contact`)
- ✅ Database migration script (`server/create_support_requests_table.cjs`)
- ✅ Resend package installed in server dependencies

### Frontend
- ✅ SupportForm component with full UI (`src/components/support/SupportForm.tsx`)
- ✅ Support tab added to Settings page
- ✅ Form validation and error handling
- ✅ Success confirmation UI

## 🔧 Required Setup Steps (You Need to Do These)

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up for a free account (3,000 emails/month, 100/day)
3. Verify your email address
4. Go to the dashboard and get your API key (starts with `re_`)

### Step 2: Set Up Email Address

Since you don't have a custom domain yet, use **Option A** (recommended):

**Option A: Use Resend's Test Domain**
1. Resend provides `onboarding@resend.dev` for testing
2. In Resend dashboard, go to "Domains" or "Verified Emails"
3. Add your personal email (e.g., `marty@dailydavid.com`) as a verified recipient
4. Click the verification link in the email Resend sends you
5. Now you can receive support emails at your verified email

**Option B: Use Gmail** (alternative)
1. Create a Gmail account (e.g., `support.dailydavid@gmail.com`)
2. In Resend dashboard, verify this Gmail address
3. Use this as both sender and recipient

### Step 3: Add Environment Variables to Vercel

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your Daily Forge project
3. Go to Settings > Environment Variables
4. Add these two variables:

   **Variable 1:**
   - Name: `RESEND_API_KEY`
   - Value: `re_Q1B9jaio_NQa2J2L5Scqx5CK2c7axv93Xey`
   - Apply to: Production, Preview, Development

   **Variable 2:**
   - Name: `SUPPORT_EMAIL`
   - Value: `dailydavidapp@gmail.com`
   - Apply to: Production, Preview, Development

5. Click "Save" for each variable

### Step 4: Run Database Migration

You need to create the `support_requests` table in your Neon database. You have two options:

**Option A: Run via Neon Dashboard (Easiest)**
1. Go to https://console.neon.tech
2. Select your Daily Forge database
3. Go to "SQL Editor"
4. Copy and paste this SQL:

```sql
CREATE TABLE IF NOT EXISTS support_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_requests_user_id 
ON support_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_support_requests_status 
ON support_requests(status);

CREATE INDEX IF NOT EXISTS idx_support_requests_created_at 
ON support_requests(created_at DESC);
```

5. Click "Run" to execute

**Option B: Run Migration Script Locally**
1. Make sure you have a `.env` file in the `server` directory with `DATABASE_URL`
2. Run: `node server/create_support_requests_table.cjs`

### Step 5: Redeploy to Vercel

After adding the environment variables:
1. Go to Vercel dashboard > Deployments
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. OR just push a small change to GitHub to trigger auto-deployment

### Step 6: Test the Support Form

1. Go to your deployed app: https://the-daily-forge.vercel.app
2. Log in with your account
3. Go to Settings (click your profile icon)
4. Click the "💬 Support" tab
5. Fill out and submit a test support request
6. Check your verified email for the support request notification

## 📧 Email Template

When a user submits a support request, you'll receive an email that looks like this:

**Subject:** `[GENERAL] Test support request`

**Body:**
```
New Support Request

From: User Name (user@email.com)
Category: general
Subject: Test support request

---

Message:
This is a test message to verify the support form is working correctly.
```

## 🔍 Troubleshooting

### "Email service not configured" in logs
- Make sure `RESEND_API_KEY` is set in Vercel environment variables
- Redeploy after adding the variable

### Not receiving emails
- Check that your email is verified in Resend dashboard
- Check Resend dashboard > Logs to see if emails are being sent
- Check spam folder
- Verify `SUPPORT_EMAIL` environment variable is correct

### Database errors
- Make sure the `support_requests` table exists
- Run the migration SQL in Neon dashboard
- Check Vercel logs for specific error messages

### Form not showing up
- Clear browser cache
- Check browser console for errors
- Make sure you're on the Settings page > Support tab

## 🎯 What Happens When a User Submits

1. User fills out the support form (category, subject, message)
2. Form validates the input
3. Request is sent to `/api/support/contact` endpoint
4. Backend stores the request in `support_requests` table
5. Backend sends email via Resend to your `SUPPORT_EMAIL`
6. User sees success confirmation
7. You receive the email with all the details

## 📊 Viewing Support Requests

Currently, support requests are:
- Stored in the `support_requests` database table
- Sent to your email

To view all requests in the database:
1. Go to Neon dashboard > SQL Editor
2. Run: `SELECT * FROM support_requests ORDER BY created_at DESC;`

## 🚀 Future Enhancements (Optional)

- Add support requests view in admin panel
- Add email templates with better styling
- Add file attachment support
- Add status tracking (open/in-progress/closed)
- Add reply functionality from admin panel
- Set up custom domain for professional email addresses

## ✅ Checklist

- [ ] Create Resend account and get API key
- [ ] Verify your email address in Resend
- [ ] Add `RESEND_API_KEY` to Vercel environment variables
- [ ] Add `SUPPORT_EMAIL` to Vercel environment variables
- [ ] Run database migration (create support_requests table)
- [ ] Redeploy Vercel app
- [ ] Test support form by submitting a request
- [ ] Verify you receive the email

Once you complete these steps, your support contact form will be fully functional!

