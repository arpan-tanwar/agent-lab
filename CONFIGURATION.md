# 🔧 Agent Lab Configuration Guide

This guide explains all the configurable environment variables in Agent Lab.

## 📋 Environment Variables

### **Database Configuration**

```bash
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

### **Gemini AI Configuration**

```bash
# Required: Your Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Default model (default: gemini-2.0-flash)
GEMINI_DEFAULT_MODEL=gemini-2.0-flash

# Optional: Default temperature (default: 0.1)
GEMINI_DEFAULT_TEMPERATURE=0.1

# Optional: Default max tokens (default: 1000)
GEMINI_DEFAULT_MAX_TOKENS=1000
```

### **Tool Configuration**

```bash
# HTTP request timeout in milliseconds (default: 30000)
TOOL_HTTP_TIMEOUT=30000

# Email tool delay in milliseconds (default: 1000)
TOOL_EMAIL_DELAY=1000

# Slack tool delay in milliseconds (default: 500)
TOOL_SLACK_DELAY=500

# CRM tool delay in milliseconds (default: 800)
TOOL_CRM_DELAY=800

# Data processing tool delay in milliseconds (default: 300)
TOOL_PROCESS_DELAY=300
```

### **Background Processing Configuration**

```bash
# Polling interval in milliseconds (default: 5000)
PROCESSING_POLL_INTERVAL=5000

# Number of concurrent runs to process (default: 3)
PROCESSING_CONCURRENCY=3
```

### **Retry Configuration**

```bash
# Maximum number of retries (default: 3)
RETRY_MAX_RETRIES=3

# Base delay between retries in milliseconds (default: 1000)
RETRY_BASE_DELAY=1000

# Maximum delay between retries in milliseconds (default: 30000)
RETRY_MAX_DELAY=30000

# Jitter factor for retry delays (default: 0.1)
RETRY_JITTER_FACTOR=0.1
```

### **Database Configuration**

```bash
# Maximum database retries (default: 3)
DB_MAX_RETRIES=3
```

### **Logging Configuration**

```bash
# Log level: debug, info, warn, error (default: info)
LOG_LEVEL=info
```

### **Node Environment**

```bash
# Environment: development, production (default: production)
NODE_ENV=production

# Server port (default: 3000)
PORT=3000
```

## 🚀 **Deployment Configuration**

### **Railway (Backend)**

Set these environment variables in your Railway project:

```bash
DATABASE_URL=your_neon_connection_string
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
LOG_LEVEL=info
PORT=3000

# Optional: Customize processing
PROCESSING_POLL_INTERVAL=5000
PROCESSING_CONCURRENCY=3

# Optional: Customize retry behavior
RETRY_MAX_RETRIES=3
RETRY_BASE_DELAY=1000
```

### **Vercel (Frontend)**

Set these environment variables in your Vercel project:

```bash
NEXT_PUBLIC_API_BASE=https://your-railway-app.up.railway.app
```

## 🎯 **Performance Tuning**

### **High Throughput Setup**

For high-volume processing, increase concurrency and adjust timeouts:

```bash
PROCESSING_CONCURRENCY=10
TOOL_HTTP_TIMEOUT=60000
PROCESSING_POLL_INTERVAL=2000
```

### **Low Latency Setup**

For faster response times, reduce delays:

```bash
TOOL_EMAIL_DELAY=100
TOOL_SLACK_DELAY=50
TOOL_CRM_DELAY=200
TOOL_PROCESS_DELAY=50
PROCESSING_POLL_INTERVAL=1000
```

### **Reliability Setup**

For maximum reliability, increase retries and timeouts:

```bash
RETRY_MAX_RETRIES=5
RETRY_BASE_DELAY=2000
RETRY_MAX_DELAY=60000
TOOL_HTTP_TIMEOUT=60000
```

## 🔍 **Monitoring Configuration**

### **Debug Mode**

Enable detailed logging for troubleshooting:

```bash
LOG_LEVEL=debug
NODE_ENV=development
```

### **Production Mode**

Optimize for production with minimal logging:

```bash
LOG_LEVEL=warn
NODE_ENV=production
```

## ✅ **Configuration Validation**

The system will use default values for any missing environment variables. All configuration is validated at startup and logged for verification.

**Example startup log:**

```
[INFO] Configuration loaded:
- LLM Model: gemini-2.0-flash
- Processing Concurrency: 3
- Poll Interval: 5000ms
- HTTP Timeout: 30000ms
```

## 🛠️ **Custom Configuration**

You can override any configuration by setting the corresponding environment variable. The system will automatically pick up changes on restart.

**No code changes required** - just update your environment variables and redeploy!
