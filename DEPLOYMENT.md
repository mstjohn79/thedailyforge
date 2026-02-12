# 🚀 Deployment Guide for Beta Testing

## Overview
This guide will help you deploy your Daily Forge app for free during beta testing.

## 🎯 Free Deployment Strategy
- **Frontend**: Netlify (free)
- **Backend**: Render (free tier)
- **Database**: Neon (free tier - you already have this)

## 📋 Step 1: Deploy Backend to Render

### 1.1 Sign up at [render.com](https://render.com)

### 1.2 Create New Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Choose the repository: `the-daily-forge`

### 1.3 Configure the Service
```
Name: daily-forge-backend
Region: Choose closest to you
Branch: main
Root Directory: daily-forge/daily-forge/server
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### 1.4 Add Environment Variables
```
NEON_CONNECTION_STRING=your_neon_connection_string
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=production
```

### 1.5 Deploy
- Click "Create Web Service"
- Wait for build to complete
- Copy the URL (e.g., `https://daily-forge-backend.onrender.com`)

## 📋 Step 2: Deploy Frontend to Netlify

### 2.1 Sign up at [netlify.com](https://netlify.com)

### 2.2 Connect Repository
- Click "New site from Git"
- Connect your GitHub repository
- Choose the repository: `the-daily-forge`

### 2.3 Configure Build Settings
```
Base directory: daily-forge/daily-forge
Build command: npm run build
Publish directory: dist
```

### 2.4 Add Environment Variables
```
VITE_API_URL=https://your-backend-render-url.onrender.com
```

### 2.5 Deploy
- Click "Deploy site"
- Wait for build to complete
- Your site will be available at `https://random-name.netlify.app`

## 🔧 Step 3: Update Frontend API URLs

The frontend will automatically use the production API URL when deployed.

## 🧪 Step 4: Test Your Deployment

1. **Test Backend**: Visit your Render URL + `/api/health`
2. **Test Frontend**: Visit your Netlify URL
3. **Test Login**: Try logging in with your existing users

## 💰 Cost Breakdown
- **Netlify**: Free forever
- **Render**: Free tier (750 hours/month)
- **Neon**: Free tier (you already have this)

## 🚨 Important Notes

### Render Free Tier Limitations
- **Sleep after 15 minutes** of inactivity
- **750 hours/month** (about 31 days)
- **First request** after sleep takes 30-60 seconds

### For Production
- Consider upgrading to paid plans
- Or migrate to other platforms like:
  - Railway ($5/month)
  - Fly.io (free tier)
  - DigitalOcean ($5/month)

## 🔄 Updating Your App

### Automatic Updates
- Both platforms will automatically redeploy when you push to GitHub
- Just commit and push your changes

### Manual Updates
- Render: Click "Manual Deploy" → "Deploy latest commit"
- Netlify: Click "Trigger deploy" → "Deploy site"

## 🆘 Troubleshooting

### Common Issues
1. **Build fails**: Check build logs in Render/Netlify
2. **API errors**: Verify environment variables
3. **Database connection**: Check Neon connection string

### Getting Help
- Render: Built-in chat support
- Netlify: Community forums
- Both have excellent documentation

## 🎉 You're Ready!

After following these steps, you'll have:
- ✅ A live, public URL for your app
- ✅ Free hosting during beta testing
- ✅ Automatic deployments from GitHub
- ✅ Professional-grade infrastructure

Your Daily Forge app will be accessible to anyone with the URL for beta testing!
