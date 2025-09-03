#!/usr/bin/env node

// Test script to simulate a failed run for demonstration
const API_BASE = 'https://agent-lab-production.up.railway.app';

async function testFailedRun() {
  console.log('🧪 Testing Failed Run Scenario...\n');

  const testData = {
    subject: 'Test Failed Run - API Timeout',
    from: 'test-fail@example.com',
    body: 'This email is designed to trigger a failure in the createCRMRecord step to demonstrate error handling and retry functionality.',
  };

  try {
    console.log('📧 Sending test email that will fail...');
    console.log('Subject:', testData.subject);
    console.log('From:', testData.from);
    console.log('Body:', testData.body);
    console.log();

    const response = await fetch(`${API_BASE}/automation/lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Lead processing started:', JSON.stringify(result, null, 2));
      console.log(
        `\n🔗 View the run in your dashboard: ${API_BASE.replace('agent-lab-production.up.railway.app', 'your-vercel-domain')}/runs/${result.runId}`,
      );
      console.log('\n📊 Expected behavior:');
      console.log(
        '- The run should process through parseEmail, enrichCompany, and scoreLead steps',
      );
      console.log('- The createCRMRecord step should fail with API_TIMEOUT error');
      console.log('- The run should show as failed with retry count');
      console.log('- You can click "Retry" to attempt the run again');
    } else {
      console.log('❌ Error:', result);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Run the test
testFailedRun();
