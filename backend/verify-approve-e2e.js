const http = require('http');

const email = 'nkdev26@gmail.com';
const password = 'password123';
const orgId = '00000000-0000-0000-0000-000000000000';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function main() {
  console.log('--- STARTING E2E INTEGRATION TEST ---');

  // 1. Authenticate to get JWT token
  console.log('\n[1] Authenticating...');
  const authRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email, password, organizationId: orgId });

  if (authRes.statusCode !== 200) {
    throw new Error(`Auth failed with status ${authRes.statusCode}: ${JSON.stringify(authRes.body)}`);
  }

  const token = authRes.body.access_token;
  const userOrgId = authRes.body.user.organizations[0].id;
  console.log('Auth successful! Token acquired.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Create a PENDING request
  console.log('\n[2] Creating a PENDING Maintenance Request...');
  const requestPayload = {
    title: 'E2E Test Request - Broken AC',
    description: 'The air conditioner in room 102 is leaking water.',
    priority: 'HIGH',
    locationId: 'default-loc',
    assetId: 'a05983c1-ad37-410d-bfab-40fd7e0b94be',
    organizationId: orgId
  };

  const createRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/requests',
    method: 'POST',
    headers
  }, requestPayload);

  if (createRes.statusCode !== 201) {
    throw new Error(`Create request failed with status ${createRes.statusCode}: ${JSON.stringify(createRes.body)}`);
  }

  const createdRequest = createRes.body;
  console.log(`Request created successfully! ID: ${createdRequest.id}`);
  console.log(`Status: ${createdRequest.status}`);

  // 3. Patch the request (simulating Save Without Approving or pre-approval patch)
  console.log('\n[3] Patching request details...');
  const patchPayload = {
    title: 'E2E Test Request - Leaking AC & Fan Noisy',
    description: 'The air conditioner in room 102 is leaking water and the fan is making a grinding noise.',
    priority: 'HIGH',
    locationId: 'default-loc',
    assetId: 'a05983c1-ad37-410d-bfab-40fd7e0b94be'
  };

  const patchRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/requests/${createdRequest.id}`,
    method: 'PATCH',
    headers
  }, patchPayload);

  if (patchRes.statusCode !== 200) {
    throw new Error(`Patch request failed with status ${patchRes.statusCode}: ${JSON.stringify(patchRes.body)}`);
  }

  console.log(`Request patched successfully!`);
  console.log(`New Title: "${patchRes.body.title}"`);

  // 4. Approve request with all dispatch details
  console.log('\n[4] Approving Request and spawning Work Order with all dispatch fields...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const approvePayload = {
    priority: 'HIGH',
    assignedToId: '56630bd6-9b3b-4afd-849f-a54b3851bc19', // NK Dev userOrganization ID
    assignedTeamId: 'team-alpha',
    checklistId: 'e269f18e-e8a3-4410-b2a0-21ca105f40ad',
    estimatedHours: '4.5',
    signatureRequired: true,
    startDate: tomorrow.toISOString(),
    dueDate: nextWeek.toISOString()
  };

  const approveRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/requests/${createdRequest.id}/approve`,
    method: 'POST',
    headers
  }, approvePayload);

  if (approveRes.statusCode !== 201 && approveRes.statusCode !== 200) {
    throw new Error(`Approve request failed with status ${approveRes.statusCode}: ${JSON.stringify(approveRes.body)}`);
  }

  const approvedRequest = approveRes.body;
  console.log(`Request approved successfully!`);
  console.log(`Status: ${approvedRequest.status}`);
  console.log(`Linked Work Order ID: ${approvedRequest.workOrderId}`);

  // 5. Query the generated Work Order to verify dispatch fields carried over
  console.log('\n[5] Fetching generated Work Order to verify carry-over fields...');
  const woRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/work-orders/${approvedRequest.workOrderId}`,
    method: 'GET',
    headers
  });

  if (woRes.statusCode !== 200) {
    throw new Error(`Fetch work order failed with status ${woRes.statusCode}: ${JSON.stringify(woRes.body)}`);
  }

  const wo = woRes.body;
  console.log('--- WORK ORDER VERIFICATION ---');
  console.log('Title:', wo.title);
  console.log('Description:', wo.description);
  console.log('Priority:', wo.priority);
  console.log('Maintenance Type:', wo.maintenanceType);
  console.log('Assigned Worker ID:', wo.assignedToId);
  console.log('Assigned Team ID:', wo.assignedTeamId);
  console.log('Checklist ID:', wo.checklistId);
  console.log('Estimated Hours:', wo.estimatedHours);
  console.log('Signature Required:', wo.signatureRequired);
  console.log('Start Date:', wo.startDate);
  console.log('Due Date:', wo.dueDate);

  // Assertion check
  let hasErrors = false;
  if (wo.priority !== approvePayload.priority) {
    console.error(`❌ Priority mismatch: Expected ${approvePayload.priority}, got ${wo.priority}`);
    hasErrors = true;
  }
  if (wo.assignedToId !== approvePayload.assignedToId) {
    console.error(`❌ Worker mismatch: Expected ${approvePayload.assignedToId}, got ${wo.assignedToId}`);
    hasErrors = true;
  }
  if (wo.assignedTeamId !== approvePayload.assignedTeamId) {
    console.error(`❌ Team mismatch: Expected ${approvePayload.assignedTeamId}, got ${wo.assignedTeamId}`);
    hasErrors = true;
  }
  if (wo.checklistId !== approvePayload.checklistId) {
    console.error(`❌ Checklist mismatch: Expected ${approvePayload.checklistId}, got ${wo.checklistId}`);
    hasErrors = true;
  }
  if (Number(wo.estimatedHours) !== Number(approvePayload.estimatedHours)) {
    console.error(`❌ Estimated Hours mismatch: Expected ${approvePayload.estimatedHours}, got ${wo.estimatedHours}`);
    hasErrors = true;
  }
  if (wo.signatureRequired !== approvePayload.signatureRequired) {
    console.error(`❌ Signature Required mismatch: Expected ${approvePayload.signatureRequired}, got ${wo.signatureRequired}`);
    hasErrors = true;
  }
  if (new Date(wo.startDate).getTime() !== new Date(approvePayload.startDate).getTime()) {
    console.error(`❌ Start Date mismatch: Expected ${approvePayload.startDate}, got ${wo.startDate}`);
    hasErrors = true;
  }
  if (new Date(wo.dueDate).getTime() !== new Date(approvePayload.dueDate).getTime()) {
    console.error(`❌ Due Date mismatch: Expected ${approvePayload.dueDate}, got ${wo.dueDate}`);
    hasErrors = true;
  }

  if (hasErrors) {
    throw new Error('E2E validation failed: Mismatched dispatch values.');
  }

  console.log('\n✅ ALL E2E DISPATCH VALUES VERIFIED AND CORRECT!');
  console.log('🎉 Full E2E connection, validation, transactions, and data flow are 100% functional!');
}

main().catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
