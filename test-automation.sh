#!/bin/bash

# Test script for Agent Lab Automation API
echo "🧪 Testing Agent Lab Automation API..."
echo

API_URL="https://agent-lab-production.up.railway.app/automation/lead"

# Test data
TEST_DATA='{
  "subject": "Interested in your product pricing",
  "from": "john.doe@acmecorp.com", 
  "body": "Hi, I am from Acme Corp and we are interested in learning more about your pricing options. Can you send us a quote? We are a mid-size company looking to scale our operations."
}'

echo "📧 Sending test email data:"
echo "$TEST_DATA" | jq .
echo

# Make the API call
echo "🚀 Calling API..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "📥 API Response:"
echo "$RESPONSE" | jq .

# Check if successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
  echo
  echo "✅ Success! Lead processing started."
  RUN_ID=$(echo "$RESPONSE" | jq -r '.runId')
  echo "🔗 Run ID: $RUN_ID"
  echo "📊 Check your dashboard to see the processing results."
else
  echo
  echo "❌ Error occurred. Check the response above."
fi
