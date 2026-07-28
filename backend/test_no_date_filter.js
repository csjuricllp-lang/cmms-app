const axios = require('axios');

async function run() {
  const loginRes = await axios.post('http://127.0.0.1:3000/auth/login', {
    email: 'nkdev26@gmail.com',
    password: 'password123',
    organizationId: '00000000-0000-0000-0000-000000000000'
  });
  
  const token = loginRes.data.access_token;
  console.log("Logged in successfully.");
  
  const params = {
    page: 1,
    limit: 20,
    status: 'OPEN,PENDING_APPROVAL,IN_PROGRESS,ON_HOLD',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
  
  const response = await axios.get('http://127.0.0.1:3000/work-orders', {
    params,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  console.log("Total items returned:", response.data.items.length);
  console.log("Items:", response.data.items.map(wo => ({ id: wo.id, title: wo.title, dueDate: wo.dueDate, status: wo.status })));
  console.log("Meta:", response.data.meta);
}

run().catch(console.error);
