# Reliability & Observability Features

## Overview

This document describes the comprehensive reliability and observability features implemented in Agent Lab, including logging, retry mechanisms, dead-letter handling, and cost monitoring.

## Features Implemented

### 1. Enhanced Logging with Pino

**Request-level logging** with unique request IDs for tracing:

- Every request gets a unique `requestId` for end-to-end tracing
- Structured JSON logging with Pino for easy parsing
- Per-step metrics including duration, tokens, and cost

**Log Format**:

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "requestId": "req_abc123",
  "runId": "run_xyz789",
  "workflowId": "wf_456",
  "stepId": 1,
  "stepName": "parseEmail",
  "stepType": "llm",
  "duration": 234,
  "tokens": 156,
  "costUsd": 0.0004,
  "retryCount": 0,
  "action": "step_completed",
  "msg": "Step completed"
}
```

### 2. Dead-Letter Queue for Failed Runs

**Failed run tracking** with detailed error information:

- Failed runs are preserved in the database with `status = 'failed'`
- `failureReason` field stores human-readable error description
- `lastError` field stores full error details as JSON
- `retryCount` tracks number of retry attempts

**API Endpoints**:

- `GET /runs/failed` - List all failed runs
- `POST /runs/:id/retry` - Retry a failed run

### 3. Retry Logic with Exponential Backoff

**Intelligent retry mechanism**:

- Exponential backoff with jitter to prevent thundering herd
- Configurable max retries (default: 3)
- Retry conditions: 429 (rate limit) and 5xx errors
- Per-step retry tracking

**Retry Configuration**:

```typescript
{
  maxRetries: 3,
  baseDelay: 1000,    // 1 second
  maxDelay: 30000,    // 30 seconds
  jitter: true,       // Add randomness
  retryCondition: (error) => {
    const status = error?.status || error?.response?.status;
    return status === 429 || (status >= 500 && status < 600);
  }
}
```

### 4. Cost Dashboard

**Real-time cost and performance monitoring**:

- Average tokens per run
- Average cost per run
- P95 latency by step
- Failure rates by step
- Total cost tracking

**Dashboard Features**:

- Time range filtering (24h, 7d, 30d)
- Step-by-step performance breakdown
- Cost efficiency metrics
- Failure rate monitoring

## Database Schema Updates

### Runs Table

```sql
ALTER TABLE runs ADD COLUMN failure_reason VARCHAR(512);
ALTER TABLE runs ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE runs ADD COLUMN max_retries INTEGER NOT NULL DEFAULT 3;
ALTER TABLE runs ADD COLUMN last_error JSONB;
```

### Artifacts Table

```sql
ALTER TABLE artifacts ADD COLUMN metrics JSONB NOT NULL DEFAULT '{}';
ALTER TABLE artifacts ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'pending';
ALTER TABLE artifacts ADD COLUMN started_at TIMESTAMP;
ALTER TABLE artifacts ADD COLUMN finished_at TIMESTAMP;
ALTER TABLE artifacts ADD COLUMN error JSONB;
ALTER TABLE artifacts ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
```

## API Endpoints

### Enhanced Run Details

```
GET /runs/:id
```

**Response includes**:

- Step-level error information
- Retry counts per step
- Detailed timing metrics
- Cost breakdown

### Retry Failed Run

```
POST /runs/:id/retry
```

**Creates new run** with incremented retry count and same input data.

### Failed Runs List

```
GET /runs/failed
```

**Returns** all runs with `status = 'failed'` including failure reasons and retry counts.

## Frontend Features

### 1. Enhanced Runs Page

- **Retry button** for failed runs
- **Retry count display** showing number of attempts
- **Error indicators** for failed steps
- **Status filtering** (all, running, completed, failed)

### 2. Cost Dashboard

- **Overview metrics** (total runs, success rate, avg tokens, avg cost)
- **Performance metrics** (latency, failure rates)
- **Step-by-step breakdown** with failure rates
- **Time range filtering**

### 3. Failed Run Details

- **Clear error trail** showing which step failed
- **Retry count** for each step
- **Error messages** and stack traces
- **One-click retry** functionality

## Testing Failed Scenarios

### Test Script

```bash
node test-failed-run.js
```

This script sends a test email designed to trigger failures in the workflow, demonstrating:

- Error handling and logging
- Retry mechanism
- Dead-letter queue functionality
- Cost tracking for failed runs

### Expected Behavior

1. **Email processing starts** normally
2. **First 3 steps succeed** (parseEmail, enrichCompany, scoreLead)
3. **createCRMRecord step fails** with API_TIMEOUT error
4. **Run marked as failed** with detailed error information
5. **Retry button appears** in the UI
6. **Cost tracking** includes partial run costs

## Monitoring and Alerting

### Key Metrics to Monitor

- **Success rate** (should be > 95%)
- **P95 latency** (should be < 3 seconds)
- **Cost per successful run** (track for budget)
- **Retry rate** (high retry rates indicate issues)

### Log Analysis

```bash
# Find failed runs
grep '"action":"step_failed"' logs/app.log | jq '.runId'

# Analyze retry patterns
grep '"action":"step_completed"' logs/app.log | jq 'select(.retryCount > 0)'

# Cost analysis
grep '"action":"run_completed"' logs/app.log | jq '.totalCostUsd'
```

## Best Practices

### 1. Error Handling

- Always log errors with context
- Include requestId for tracing
- Store both human-readable and technical error details

### 2. Retry Strategy

- Use exponential backoff with jitter
- Set reasonable retry limits
- Monitor retry rates for system health

### 3. Cost Management

- Set up alerts for cost spikes
- Monitor cost per successful run
- Track wasted costs from failed runs

### 4. Monitoring

- Set up dashboards for key metrics
- Create alerts for high failure rates
- Regular log analysis for patterns

## Migration Instructions

1. **Run database migration**:

   ```bash
   psql $DATABASE_URL -f migration-reliability.sql
   ```

2. **Deploy updated API** with enhanced logging and retry logic

3. **Deploy updated frontend** with dashboard and retry functionality

4. **Test failed scenario**:

   ```bash
   node test-failed-run.js
   ```

5. **Verify dashboard** shows cost and performance metrics

## Screenshots

### Failed Run with Error Trail

![Failed Run Details](screenshots/failed-run-details.png)
_Shows clear error trail, retry count, and retry button_

### Cost Dashboard

![Cost Dashboard](screenshots/cost-dashboard.png)
_Displays comprehensive cost and performance metrics_

### Retry Functionality

![Retry Button](screenshots/retry-button.png)
_One-click retry for failed runs_

## Conclusion

The reliability and observability features provide:

- **Complete visibility** into run execution
- **Automatic retry** for transient failures
- **Cost monitoring** and optimization
- **Dead-letter queue** for manual intervention
- **Comprehensive logging** for debugging

This ensures Agent Lab can handle production workloads with confidence and provides the tools needed to maintain high reliability and cost efficiency.
