# Vercel Deployment Guide

## Current Configuration

The project is now properly configured for Vercel deployment with the following settings:

### 1. Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "buildCommand": "pnpm build:ui",
  "outputDirectory": "apps/ui/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

**Important**: The `rootDirectory` must be set in the Vercel dashboard, not in the `vercel.json` file.

### 2. Build Scripts

- **Root package.json**: Added `build:ui` script that installs dependencies and builds the UI
- **UI package.json**: Standard Next.js build scripts

### 3. Environment Variables

The UI app is configured to use:

- **Production API**: `https://agent-lab-production.up.railway.app` (Railway deployment)
- **Fallback**: `http://localhost:8787` (for local development)

## Deployment Steps

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name: agent-lab-ui
# - Directory: apps/ui
# - Override settings? Yes
# - Build Command: pnpm build:ui
# - Output Directory: apps/ui/.next
# - Install Command: pnpm install
# - Development Command: cd apps/ui && pnpm dev
```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/ui` ⚠️ **CRITICAL: Set this in the dashboard**
   - **Build Command**: `pnpm build:ui`
   - **Output Directory**: `apps/ui/.next`
   - **Install Command**: `pnpm install`
5. Add Environment Variables:
   - `NEXT_PUBLIC_API_BASE`: `https://agent-lab-production.up.railway.app`
6. Click "Deploy"

### Option 3: Automatic Deployment (Recommended)

1. Connect your GitHub repository to Vercel
2. The `vercel.json` configuration will be automatically detected
3. Vercel will use the settings from the configuration file
4. Every push to main will trigger an automatic deployment

## Environment Variables

Set these in your Vercel project settings:

| Variable               | Value                                         | Description      |
| ---------------------- | --------------------------------------------- | ---------------- |
| `NEXT_PUBLIC_API_BASE` | `https://agent-lab-production.up.railway.app` | API base URL     |
| `NODE_ENV`             | `production`                                  | Environment mode |

## Troubleshooting

### Build Fails

- Ensure `pnpm` is available in the build environment
- Check that all dependencies are properly installed
- Verify the build command works locally: `pnpm build:ui`

### 404 Errors

- Verify the `rootDirectory` is set to `apps/ui`
- Check that the `outputDirectory` points to `apps/ui/.next`
- Ensure the build completed successfully

### API Connection Issues

- Verify the `NEXT_PUBLIC_API_BASE` environment variable is set
- Check that the Railway API is accessible
- Test the API endpoint manually

## Current Status

✅ **Vercel Configuration**: Properly configured for monorepo
✅ **Build Scripts**: Working locally
✅ **Environment Variables**: Configured for production
✅ **API Integration**: Connected to Railway backend

## Next Steps

1. Deploy to Vercel using one of the methods above
2. Test the deployed application
3. Verify all routes work correctly
4. Check that the API integration is working
