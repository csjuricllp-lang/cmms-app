const axios = require('axios');

async function run() {
  const loginRes = await axios.post('http://127.0.0.1:3000/auth/login', {
    email: 'nkdev26@gmail.com',
    password: 'password123',
    organizationId: '00000000-0000-0000-0000-000000000000'
  });
  
  const token = loginRes.data.access_token;
  console.log("Logged in successfully. Token length:", token.length);
  
  const params = {
    page: 1,
    limit: 20,
    dueDateStart: '2026-06-21T18:30:00.000Z',
    dueDateEnd: '2026-06-21T18:30:00.000Z',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
  
  console.log("Sending GET /work-orders with params:", params);
  try {
    const response = await axios.get('http://127.0.0.1:3000/work-orders', {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log("Response Status:", response.status);
    console.log("Is array or paginated object? Keys:", Object.keys(response.data));
    if (response.data.items) {
      console.log("Total items returned:", response.data.items.length);
      console.log("Items:", response.data.items.map(wo => ({ id: wo.id, title: wo.title, dueDate: wo.dueDate })));
      console.log("Meta:", response.data.meta);
    } else {
      console.log("Returned array length:", response.data.length);
      console.log("Items:", response.data.map(wo => ({ id: wo.id, title: wo.title, dueDate: wo.dueDate })));
    }
  } catch (err) {
    console.error("Error fetching work orders:", err.response?.status, err.response?.data || err.message);
  }
}

run();
