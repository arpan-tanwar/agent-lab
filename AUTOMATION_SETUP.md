# Automation Setup Guide

This guide shows how to set up email automation using either Zapier or n8n to automatically process leads when new emails arrive.

## Overview

The automation flow:

1. **Trigger**: New email with "Leads" label arrives in Gmail
2. **Action**: Send email data to Agent Lab API
3. **Processing**: Agent Lab processes the lead through the workflow
4. **Notification**: Results are sent to Slack (optional)

## API Endpoint

**Endpoint**: `POST https://agent-lab-production.up.railway.app/automation/lead`

**Request Body**:

```json
{
  "subject": "Email subject line",
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

---

## Option 1: Zapier Setup (Recommended - Easier)

### Cost: Free tier available (100 tasks/month), then $19.99/month

### Step-by-Step Setup (6 steps, <15 minutes)

#### Step 1: Create Zapier Account

1. Go to [zapier.com](https://zapier.com)
2. Sign up for a free account
3. Click "Create Zap"

#### Step 2: Set Up Gmail Trigger

1. Search for "Gmail" in the trigger apps
2. Select "Gmail" → "New Email with Label"
3. Connect your Gmail account (authorize access)
4. Select "Leads" as the label to monitor
5. Test the trigger by sending yourself a test email with the "Leads" label

#### Step 3: Configure Webhook Action

1. Click "+" to add an action
2. Search for "Webhooks" → "POST"
3. Set URL: `https://agent-lab-production.up.railway.app/automation/lead`
4. Set Method: POST
5. Set Headers: `Content-Type: application/json`

#### Step 4: Map Email Data

1. In the "Data" section, add:
   ```json
   {
     "subject": "[Gmail Subject]",
     "from": "[Gmail From]",
     "body": "[Gmail Body]"
   }
   ```
2. Use the dropdown to map Gmail fields to the JSON structure

#### Step 5: Test the Zap

1. Click "Test & Review"
2. Send yourself a test email with "Leads" label
3. Verify the webhook is called successfully
4. Check your Agent Lab dashboard to see the new run

#### Step 6: Activate the Zap

1. Click "Turn on Zap"
2. Your automation is now live!

### Zapier Screenshots

![Zapier Setup - Gmail Trigger](screenshots/zapier-gmail-trigger.png)
_Gmail trigger configuration_

![Zapier Setup - Webhook Action](screenshots/zapier-webhook-action.png)
_Webhook action configuration_

![Zapier Setup - Data Mapping](screenshots/zapier-data-mapping.png)
_Email data mapping to API_

---

## Option 2: n8n Setup (More Flexible)

### Cost: Free self-hosted, or $20/month for n8n Cloud

### Step-by-Step Setup (6 steps, <15 minutes)

#### Step 1: Set Up n8n

1. Go to [n8n.io](https://n8n.io)
2. Sign up for n8n Cloud or install locally
3. Create a new workflow

#### Step 2: Add Gmail Trigger

1. Click "+" to add a node
2. Search for "Gmail" → "Gmail Trigger"
3. Connect your Gmail account
4. Set Label: "Leads"
5. Set Poll Times: 1 minute

#### Step 3: Add HTTP Request Node

1. Add "HTTP Request" node
2. Set Method: POST
3. Set URL: `https://agent-lab-production.up.railway.app/automation/lead`
4. Set Headers: `Content-Type: application/json`

#### Step 4: Configure Request Body

1. In Body section, set:
   ```json
   {
     "subject": "{{ $json.subject }}",
     "from": "{{ $json.from }}",
     "body": "{{ $json.body }}"
   }
   ```

#### Step 5: Add Slack Notification (Optional)

1. Add "Slack" node
2. Connect your Slack workspace
3. Set Channel: #leads
4. Set Message: "New lead processed: {{ $json.message }}"

#### Step 6: Test and Activate

1. Click "Execute Workflow" to test
2. Send test email with "Leads" label
3. Verify all nodes execute successfully
4. Activate the workflow

### n8n Screenshots

![n8n Setup - Workflow Overview](screenshots/n8n-workflow-overview.png)
_Complete n8n workflow_

![n8n Setup - Gmail Node](screenshots/n8n-gmail-node.png)
_Gmail trigger configuration_

![n8n Setup - HTTP Request](screenshots/n8n-http-request.png)
_HTTP request to Agent Lab API_

---

## Testing Your Automation

### Test Email Template

Send yourself an email with:

- **To**: Your Gmail address
- **Subject**: "Interested in your product pricing"
- **Body**: "Hi, I'm from Acme Corp and we're interested in learning more about your pricing options. Can you send us a quote?"
- **Label**: "Leads" (apply this label in Gmail)

### Expected Results

1. Email triggers automation
2. Agent Lab processes the lead
3. You see a new run in your dashboard
4. Lead is scored and processed through the workflow
5. Optional: Slack notification sent

### Troubleshooting

#### Common Issues:

1. **Gmail not triggering**: Check label is applied correctly
2. **Webhook failing**: Verify API URL and JSON format
3. **No runs created**: Check API logs for errors

#### Debug Steps:

1. Check automation tool logs
2. Verify API endpoint is accessible
3. Test API directly with curl:
   ```bash
   curl -X POST https://agent-lab-production.up.railway.app/automation/lead \
     -H "Content-Type: application/json" \
     -d '{"subject":"Test","from":"test@example.com","body":"Test email"}'
   ```

---

## Cost Comparison

| Tool       | Free Tier        | Paid Plans      | Best For                           |
| ---------- | ---------------- | --------------- | ---------------------------------- |
| **Zapier** | 100 tasks/month  | $19.99/month    | Non-technical users, quick setup   |
| **n8n**    | Self-hosted free | $20/month cloud | Technical users, complex workflows |

## Recommendation

**For most users**: Start with **Zapier** - it's easier to set up and has a generous free tier.

**For advanced users**: Use **n8n** if you need more complex logic or want to self-host.

---

## Next Steps

1. Choose your automation tool (Zapier recommended)
2. Follow the 6-step setup guide above
3. Test with a sample email
4. Monitor your Agent Lab dashboard for processed leads
5. Set up Slack notifications for real-time updates

Your email automation is now ready to process leads automatically! 🚀
