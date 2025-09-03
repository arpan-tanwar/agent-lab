# ⚡ Agent Lab Quick Start Guide

Get Agent Lab running in 15 minutes with Vercel, Railway, and Neon.

## 🎯 Prerequisites

- GitHub account
- [Vercel](https://vercel.com) account
- [Railway](https://railway.app) account
- [Neon](https://neon.tech) account

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Neon Database (2 minutes)

1. Go to [Neon Console](https://console.neon.tech)
2. Click "Create Project"
3. Name it "agent-lab"
4. Copy the connection string (starts with `postgresql://`)

### Step 2: Setup Database Schema (1 minute)

1. In Neon Console, go to "SQL Editor"
2. Copy the entire contents of `setup-neon-database.sql`
3. Paste and run the SQL script
4. Verify tables were created

### Step 3: Deploy Backend to Railway (3 minutes)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your Agent Lab repository
4. Add environment variable:
   ```
   DATABASE_URL=your_neon_connection_string
   ```
5. Railway will auto-deploy (note the URL)

### Step 4: Deploy Frontend to Vercel (3 minutes)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project" → Import from GitHub
3. Select your repository
4. Set **Root Directory** to `apps/ui`
5. Add environment variable:
   ```
   NEXT_PUBLIC_API_BASE=https://your-railway-app.up.railway.app
   ```
6. Click "Deploy"

### Step 5: Test Everything (2 minutes)

1. Go to your Vercel URL
2. Navigate to **Workflows** page
3. Click "Create Workflow"
4. Enter name: "Test Workflow"
5. Click "Create"
6. Verify it appears in the list

## 🧪 Test the Complete Workflow

### Test API Endpoints

```bash
# Test health endpoint
curl https://your-railway-app.up.railway.app/health

# Test workflow creation
curl -X POST https://your-railway-app.up.railway.app/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Workflow", "version": 1}'

# Test email automation
curl -X POST https://your-railway-app.up.railway.app/automation/lead \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "New Lead Inquiry",
    "from": "lead@example.com",
    "body": "I am interested in your services"
  }'
```

### Test Frontend Features

1. **Homepage**: Should show modern UI with dark mode toggle
2. **Workflows**: Create, view, and manage workflows
3. **Runs**: View workflow executions and retry failed runs
4. **Dashboard**: See metrics and performance data
5. **Tests**: Run test suites with visual feedback

## 🔧 Troubleshooting

### Common Issues

#### "Database not initialized" Error

- Run the SQL script in Neon Console
- Check DATABASE_URL is correct in Railway

#### CORS Errors

- Verify NEXT_PUBLIC_API_BASE points to your Railway URL
- Check Railway app is deployed and running

#### 404 Errors

- Ensure Railway app is deployed
- Check API_BASE URL in frontend
- Verify all environment variables are set

#### Build Failures

- Check Railway/Vercel logs
- Verify all dependencies are installed
- Ensure build commands are correct

### Debug Commands

```bash
# Check Railway deployment
railway status

# View Railway logs
railway logs

# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check API health
curl https://your-railway-app.up.railway.app/health
```

## 📊 What You Should See

### Working Features

- ✅ Modern UI with dark mode
- ✅ Workflow creation and management
- ✅ Run monitoring with retry functionality
- ✅ Real-time dashboard with metrics
- ✅ Test suite execution
- ✅ Email automation triggers
- ✅ Responsive design on all devices

### Sample Data

The database setup includes sample workflows:

- Lead Triage (3 steps)
- Ticket Summarizer
- Email Responder

## 🎉 Success!

If everything works, you should have:

- A fully functional Agent Lab deployment
- Modern, responsive UI
- Working API endpoints
- Database with sample data
- Email automation ready for Zapier/n8n

## 🚀 Next Steps

1. **Set up Zapier**: Connect Gmail → Webhook → Agent Lab
2. **Configure n8n**: Gmail → HTTP Request → Slack
3. **Monitor**: Check Railway and Vercel dashboards
4. **Scale**: Add more workflows and automation

## 📚 Additional Resources

- [Full Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Database Schema](setup-neon-database.sql)
- [API Documentation](src/api/server.ts)
- [Frontend Components](apps/ui/src)

Your Agent Lab is now ready for production use! 🎉
