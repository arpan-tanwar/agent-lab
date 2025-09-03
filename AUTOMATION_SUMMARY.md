# Automation Setup - Complete ✅

## What's Been Built

### 1. Enhanced API Endpoint

- **New endpoint**: `POST /automation/lead`
- **Purpose**: Accept email data from automation tools and automatically process leads
- **Input**: `{subject, from, body}`
- **Output**: `{success, runId, workflowId, message}`

### 2. Database Schema Update

- **Added**: `input` field to `runs` table to store email data
- **Migration**: `migration-add-input.sql` provided

### 3. Complete Documentation

- **Main guide**: `AUTOMATION_SETUP.md` with step-by-step instructions
- **Updated README**: Added automation section with quick setup
- **Test scripts**: `test-automation.sh` and `test-automation.js`

## Cost Comparison

| Tool       | Free Tier        | Paid Plans      | Recommendation                    |
| ---------- | ---------------- | --------------- | --------------------------------- |
| **Zapier** | 100 tasks/month  | $19.99/month    | ✅ **Recommended** - Easier setup |
| **n8n**    | Self-hosted free | $20/month cloud | Advanced users only               |

## Quick Setup (6 Steps, <15 Minutes)

### For Zapier (Recommended):

1. Create Zapier account
2. Set up Gmail trigger (monitor "Leads" label)
3. Add webhook action (POST to your API)
4. Map email data to JSON
5. Test with sample email
6. Activate the Zap

### For n8n:

1. Set up n8n (cloud or self-hosted)
2. Add Gmail trigger node
3. Add HTTP request node
4. Configure request body mapping
5. Add optional Slack notification
6. Test and activate workflow

## API Endpoint Details

**URL**: `https://agent-lab-production.up.railway.app/automation/lead`

**Request**:

```json
{
  "subject": "Email subject",
  "from": "sender@example.com",
  "body": "Email content"
}
```

**Response**:

```json
{
  "success": true,
  "runId": "uuid",
  "workflowId": "uuid",
  "message": "Lead processing started successfully"
}
```

## Testing

### Test Scripts Provided:

- `test-automation.sh` - Bash script for testing
- `test-automation.js` - Node.js script for testing

### Manual Test:

```bash
curl -X POST https://agent-lab-production.up.railway.app/automation/lead \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Interested in pricing",
    "from": "lead@company.com",
    "body": "Hi, we are interested in your product."
  }'
```

## Next Steps

1. **Deploy the API changes** (database migration + new endpoint)
2. **Choose automation tool** (Zapier recommended)
3. **Follow the 6-step setup guide** in `AUTOMATION_SETUP.md`
4. **Test with sample email** using "Leads" label
5. **Monitor your dashboard** for processed leads

## Files Created

- `AUTOMATION_SETUP.md` - Complete setup guide with screenshots
- `AUTOMATION_SUMMARY.md` - This summary
- `automation-flow.txt` - Visual flow diagram
- `test-automation.sh` - Bash test script
- `test-automation.js` - Node.js test script
- `migration-add-input.sql` - Database migration

## Ready for Demo! 🚀

The automation setup is complete and ready for demonstration. A non-engineer can set this up in under 15 minutes following the provided guide.
