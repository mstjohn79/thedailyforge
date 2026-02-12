# API.Bible Setup Guide

To use real scripture data in The Daily Forge app, you need to get a free API key from API.Bible.

## Step 1: Get API Key

1. Go to [API.Bible](https://scripture.api.bible/)
2. Click "Get Started" or "Sign Up"
3. Create a free account
4. Go to your dashboard and copy your API key

## Step 2: Add API Key to App

1. Open `daily-forge/src/lib/bibleService.ts`
2. Find this line:
   ```typescript
   const API_KEY = 'YOUR_API_KEY_HERE'; // We'll need to get this from API.Bible
   ```
3. Replace `'YOUR_API_KEY_HERE'` with your actual API key:
   ```typescript
   const API_KEY = 'your-actual-api-key-here';
   ```

## Step 3: Test the Integration

1. Start the development server: `npm run dev`
2. Go to Daily Entry → SOAP Section
3. Try the "Today's Devotion" buttons - they should now load real scripture!

## Free Tier Limits

- **5,000 queries per day**
- **500 consecutive verses at a time**
- **Perfect for personal use**

## What You'll Get

- **2,500+ Bible versions** in 1,600+ languages
- **Real scripture content** from API.Bible
- **Proper copyright attribution**
- **Search functionality** across all versions

## Troubleshooting

If you see "No API key provided" warnings:
1. Make sure you've added your API key to `bibleService.ts`
2. Restart the development server
3. Check the browser console for any error messages

## Security Note

For production, consider using environment variables instead of hardcoding the API key.
