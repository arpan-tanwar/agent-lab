#!/usr/bin/env node

// Test script for the automation API endpoint
const API_BASE = 'https://agent-lab-production.up.railway.app';

async function testAutomationAPI() {
  console.log('🧪 Testing Agent Lab Automation API...\n');

  const testData = {
    subject: 'Interested in your product pricing',
    from: 'john.doe@acmecorp.com',
    body: "Hi, I'm from Acme Corp and we're interested in learning more about your pricing options. Can you send us a quote? We're a mid-size company looking to scale our operations.",
  };

  try {
    console.log('📧 Sending test email data:', JSON.stringify(testData, null, 2));

    const response = await fetch(`${API_BASE}/automation/lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Success! API Response:', JSON.stringify(result, null, 2));
      console.log(
        `\n🔗 View the run in your dashboard: ${API_BASE.replace('agent-lab-production.up.railway.app', 'your-vercel-domain')}/runs/${result.runId}`,
      );
    } else {
      console.log('❌ Error:', result);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Run the test
testAutomationAPI();
