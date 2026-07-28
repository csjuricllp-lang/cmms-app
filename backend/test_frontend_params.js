const axios = require('axios');

async function run() {
  const loginRes = await axios.post('http://127.0.0.1:3000/auth/login', {
    email: 'nkdev26@gmail.com',
    password: 'password123',
    organizationId: '00000000-0000-0000-0000-000000000000'
  });
  
  const token = loginRes.data.access_token;
  
  const params = {
    page: 1,
    limit: 20,
    search: '',
    status: 'OPEN,PENDING_APPROVAL,IN_PROGRESS,ON_HOLD',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    dueDateStart: '2026-06-21T18:30:00.000Z',
    dueDateEnd: '2026-06-21T18:30:00.000Z'
  };
  
  console.log("Sending GET /work-orders with exact frontend params...");
  try {
    const response = await axios.get('http://127.0.0.1:3000/work-orders', {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Response status:", response.status);
    console.log("Response items count:", response.data.items?.length);
    console.log("Response meta:", response.data.meta);
  } catch (err) {
    console.error("API error:", err.response?.status, err.response?.data);
  }
}

run();
