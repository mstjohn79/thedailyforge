# Vercel Deployment Guide for The Daily Forge Modern App

## Why Vercel?

- **Full-stack support**: Handles both React frontend and Node.js backend
- **Free tier**: 100GB bandwidth/month, serverless functions, edge functions
- **Automatic scaling**: Scales to zero when not in use, scales up automatically
- **Git integration**: Deploys automatically on git push
- **Global CDN**: Edge functions for better performance

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Integration**: Connect your GitHub account to Vercel
3. **Environment Variables**: Set up your Neon database connection

## Deployment Steps

### 1. Install Vercel CLI (Optional but Recommended)

```bash
npm i -g vercel
```

### 2. Set Up Environment Variables

In your Vercel dashboard, set these environment variables:

```env
NEON_CONNECTION_STRING=postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-super-secure-jwt-secret-key
NODE_ENV=production
```

### 3. Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select the `daily-forge/daily-forge` folder
4. Vercel will automatically detect the configuration
5. Click "Deploy"

### 4. Deploy via CLI (Alternative)

```bash
cd daily-forge/daily-forge
vercel
```

Follow the prompts to link to your Vercel project.

### 5. Automatic Deployments

Once connected, every push to your main branch will automatically deploy to Vercel.

## Project Structure for Vercel

```
daily-forge/
├── api/
│   └── index.js          # Vercel serverless function entry point
├── server/
│   └── index.js          # Express server logic
├── src/                  # React frontend
├── vercel.json           # Vercel configuration
├── vercel-build.json     # Build configuration
└── package.json          # Dependencies and scripts
```

## Configuration Files

### vercel.json
- Routes API calls to the serverless function
- Serves static files from the React build
- Configures function timeouts

### vercel-build.json
- Specifies build command and output directory
- Ensures proper build process

## API Endpoints

Your Express server endpoints will be available at:
- `/api/auth/login` - User authentication
- `/api/health` - Health check
- `/api/admin/users` - Admin user management
- `/api/setup` - Initial setup

## Frontend Configuration

The React app will be served from the root path, with API calls automatically routed to your serverless function.

## Monitoring and Scaling

- **Function Logs**: View in Vercel dashboard
- **Performance**: Monitor function execution times
- **Scaling**: Automatic based on demand
- **Edge Functions**: Global CDN distribution

## Troubleshooting

### Common Issues

1. **Environment Variables**: Ensure all required env vars are set
2. **Database Connection**: Verify Neon connection string
3. **Build Errors**: Check build logs in Vercel dashboard
4. **Function Timeouts**: Increase maxDuration in vercel.json if needed

### Debug Commands

```bash
# View function logs
vercel logs

# Test locally
vercel dev

# Check deployment status
vercel ls
```

## Cost Optimization

- **Free Tier**: 100GB bandwidth/month
- **Serverless**: Pay only for actual usage
- **Edge Functions**: Global performance without extra cost
- **Auto-scaling**: Scales to zero when not in use

## Next Steps

1. Deploy to Vercel
2. Test all API endpoints
3. Verify database connections
4. Set up custom domain (optional)
5. Configure monitoring and alerts

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Discord**: [vercel.com/chat](https://vercel.com/chat)
