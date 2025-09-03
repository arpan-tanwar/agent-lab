# 🚀 Agent Lab Deployment Guide

Complete setup guide for deploying Agent Lab with Vercel (frontend), Railway (backend), and Neon (PostgreSQL).

## 📋 Prerequisites

- [Vercel](https://vercel.com) account
- [Railway](https://railway.app) account
- [Neon](https://neon.tech) account
- GitHub repository with your code

## 🗄️ Step 1: Setup Neon PostgreSQL Database

### 1.1 Create Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy your connection string (it looks like: `postgresql://username:password@hostname/database?sslmode=require`)

### 1.2 Run Database Migration

1. Set your DATABASE_URL environment variable:

   ```bash
   export DATABASE_URL="your_neon_connection_string"
   ```

2. Run the database setup:

   ```bash
   # Option A: Use the migration script
   ./run-migration.sh

   # Option B: Run manually
   pnpm drizzle-kit migrate

   # Option C: Execute SQL directly in Neon console
   # Copy and paste the contents of setup-database.sql
   ```

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Connect Railway to GitHub

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your Agent Lab repository

### 2.2 Configure Environment Variables

In Railway dashboard, add these environment variables:

```
DATABASE_URL=your_neon_connection_string
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

### 2.3 Configure Build Settings

Railway should auto-detect Node.js, but ensure:

- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`
- **Root Directory**: `/` (root of repo)

### 2.4 Deploy

1. Railway will automatically deploy when you push to main branch
2. Note your Railway app URL (e.g., `https://agent-lab-production.up.railway.app`)

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Connect Vercel to GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project" → Import from GitHub
3. Select your Agent Lab repository

### 3.2 Configure Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `apps/ui`
- **Build Command**: `pnpm build`
- **Output Directory**: `.next` (default)

### 3.3 Configure Environment Variables

In Vercel dashboard, add:

```
NEXT_PUBLIC_API_BASE=https://your-railway-app.up.railway.app
```

### 3.4 Deploy

1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Note your Vercel URL (e.g., `https://agent-lab.vercel.app`)

## 🔧 Step 4: Update API Configuration

### 4.1 Update Frontend API Base

Update `apps/ui/src/lib/api.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://your-railway-app.up.railway.app';
```

### 4.2 Update CORS Settings

In `src/api/server.ts`, ensure CORS is configured for your Vercel domain:

```typescript
app.use(
  '*',
  cors({
    origin: [
      'https://your-app.vercel.app',
      'http://localhost:3000', // for local development
    ],
  }),
);
```

## 🧪 Step 5: Test the Complete Workflow

### 5.1 Test Database Connection

```bash
curl https://your-railway-app.up.railway.app/health
```

### 5.2 Test Workflow Creation

```bash
curl -X POST https://your-railway-app.up.railway.app/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Workflow", "version": 1}'
```

### 5.3 Test Frontend

1. Go to your Vercel URL
2. Navigate to Workflows page
3. Try creating a new workflow
4. Check the Dashboard for metrics

## 🔄 Step 6: Automation Setup

### 6.1 Zapier Integration

1. Go to [Zapier](https://zapier.com)
2. Create a new Zap:
   - **Trigger**: Gmail - New Email with Label "Leads"
   - **Action**: Webhooks - POST Request
   - **URL**: `https://your-railway-app.up.railway.app/automation/lead`
   - **Data**: `{"subject": "{{Subject}}", "from": "{{From}}", "body": "{{Body}}"}`

### 6.2 Test Automation

Send a test email with the "Leads" label and verify it creates a workflow run.

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors

- Verify DATABASE_URL is correct
- Check if database tables exist
- Run the migration script

#### CORS Errors

- Update CORS origin in server.ts
- Ensure Vercel domain is whitelisted

#### Build Failures

- Check environment variables are set
- Verify build commands are correct
- Check logs in Railway/Vercel dashboards

#### API 404 Errors

- Verify Railway app is deployed and running
- Check API_BASE URL in frontend
- Test API endpoints directly

### Debug Commands

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Test API health
curl https://your-railway-app.up.railway.app/health

# Check database tables
psql $DATABASE_URL -c "\dt"

# View Railway logs
railway logs

# View Vercel logs
vercel logs
```

## 📊 Monitoring

### Railway Monitoring

- Check Railway dashboard for app health
- Monitor resource usage
- View application logs

### Vercel Monitoring

- Check Vercel dashboard for build status
- Monitor function execution
- View analytics

### Database Monitoring

- Monitor Neon dashboard for connection count
- Check query performance
- Set up alerts for high usage

## 🔐 Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **CORS**: Restrict to your domains only
3. **Database**: Use connection pooling and SSL
4. **API Keys**: Rotate regularly
5. **Monitoring**: Set up alerts for errors

## 📈 Scaling

### Database Scaling

- Neon automatically scales PostgreSQL
- Monitor connection limits
- Consider read replicas for high traffic

### Backend Scaling

- Railway auto-scales based on traffic
- Monitor memory and CPU usage
- Consider horizontal scaling for high load

### Frontend Scaling

- Vercel CDN handles global distribution
- Monitor function execution limits
- Consider edge functions for better performance

## 🎉 Success Checklist

- [ ] Neon database created and migrated
- [ ] Railway backend deployed and healthy
- [ ] Vercel frontend deployed and accessible
- [ ] API endpoints responding correctly
- [ ] Frontend can create workflows
- [ ] Dashboard shows metrics
- [ ] Automation triggers working
- [ ] All tests passing
- [ ] Monitoring set up
- [ ] Documentation updated

Your Agent Lab should now be fully functional! 🚀
