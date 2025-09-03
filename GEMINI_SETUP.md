# 🤖 Gemini API Setup Guide

This guide will help you set up the Gemini API key for the Agent Lab workflow execution engine.

## 🔑 Getting Your Gemini API Key

### Step 1: Go to Google AI Studio

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account

### Step 2: Create API Key

1. Click on "Get API Key" in the left sidebar
2. Click "Create API Key"
3. Choose "Create API key in new project" or select an existing project
4. Copy the generated API key

### Step 3: Set Environment Variable

#### For Local Development

Create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your_api_key_here
```

#### For Railway Deployment

1. Go to your Railway project dashboard
2. Navigate to "Variables" tab
3. Add a new environment variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `your_api_key_here`

#### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add a new environment variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `your_api_key_here`
   - **Environment**: Production, Preview, Development

## 🧪 Testing the Setup

### Test API Key

```bash
# Test the API key works
curl -X POST https://agent-lab-production.up.railway.app/process
```

### Test Workflow Execution

```bash
# Create a test workflow
curl -X POST https://agent-lab-production.up.railway.app/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test LLM Workflow",
    "steps": [
      {
        "type": "llm",
        "order": 0,
        "config": {
          "prompt": "What is 2+2? Answer with just the number.",
          "temperature": 0.1
        }
      }
    ]
  }'

# Start a run (replace WORKFLOW_ID with the returned ID)
curl -X POST https://agent-lab-production.up.railway.app/runs/WORKFLOW_ID/start

# Check the run status (replace RUN_ID with the returned ID)
curl https://agent-lab-production.up.railway.app/runs/RUN_ID
```

## 💰 Cost Information

- **Gemini 1.5 Flash**: Currently **FREE** (used by default)
- **Gemini 1.5 Pro**: $1.25 per 1M tokens
- **Gemini 1.0 Pro**: $1.25 per 1M tokens

The system is configured to use Gemini 1.5 Flash by default, which is free to use.

## 🔧 Configuration Options

### Model Selection

You can specify different models in your workflow steps:

```json
{
  "type": "llm",
  "order": 0,
  "config": {
    "prompt": "Your prompt here",
    "model": "gemini-1.5-pro", // Optional: defaults to gemini-1.5-flash
    "temperature": 0.1, // Optional: 0.0 to 1.0
    "maxTokens": 1000 // Optional: max response length
  }
}
```

### Available Models

- `gemini-1.5-flash` (default, free)
- `gemini-1.5-pro` (paid)
- `gemini-1.0-pro` (paid)

## 🚨 Troubleshooting

### Common Issues

#### "GEMINI_API_KEY environment variable is required"

- Make sure you've set the environment variable correctly
- Restart your application after setting the variable
- Check that the variable name is exactly `GEMINI_API_KEY`

#### "LLM call failed: API key not valid"

- Verify your API key is correct
- Make sure you copied the entire key without extra spaces
- Check that your Google AI Studio account is active

#### "Rate limit exceeded"

- Gemini has rate limits for free usage
- Consider upgrading to a paid plan for higher limits
- Implement retry logic with exponential backoff

### Getting Help

- [Google AI Studio Documentation](https://ai.google.dev/docs)
- [Gemini API Reference](https://ai.google.dev/api/rest)
- [Rate Limits and Quotas](https://ai.google.dev/pricing)

## ✅ Verification

Once set up correctly, you should be able to:

1. ✅ Create workflows with LLM steps
2. ✅ Execute workflows that call Gemini
3. ✅ See real responses in the run timeline
4. ✅ View token usage and cost metrics

Your Agent Lab is now ready to execute intelligent workflows with Gemini! 🚀
