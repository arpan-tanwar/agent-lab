# Vercel Deployment Guide

## Environment Variables Setup

### Option 1: Using vercel.json (Current Setup)

The `apps/ui/vercel.json` file is already configured with the correct environment variable:

```json
{
  "env": {
    "NEXT_PUBLIC_API_BASE": "https://agent-lab-production.up.railway.app"
  }
}
```

### Option 2: Manual Setup in Vercel Dashboard

If you prefer to set environment variables manually in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name**: `NEXT_PUBLIC_API_BASE`
   - **Value**: `https://agent-lab-production.up.railway.app`
   - **Environment**: Production, Preview, Development

### Option 3: Using Vercel CLI

```bash
vercel env add NEXT_PUBLIC_API_BASE
# Enter: https://agent-lab-production.up.railway.app
```

## Deployment Steps

1. **Push to GitHub**: The changes are already committed
2. **Vercel Auto-Deploy**: Vercel will automatically detect the changes and deploy
3. **Verify Deployment**: Check that the environment variable is properly set

## Troubleshooting

### If deployment still fails:

1. Check Vercel dashboard for build logs
2. Verify the environment variable is set correctly
3. Ensure the Railway backend is running and accessible

### Common Issues:

- **Environment Variable Not Found**: Make sure `NEXT_PUBLIC_API_BASE` is set in Vercel
- **API Connection Failed**: Verify the Railway backend URL is correct
- **Build Failures**: Check that all dependencies are properly installed

## Current Configuration

- **Frontend**: Vercel (Next.js)
- **Backend**: Railway (Hono API)
- **Database**: Neon (PostgreSQL)
- **API Base URL**: `https://agent-lab-production.up.railway.app`

The deployment should now work correctly! 🚀
