const http = require('http');

const data = JSON.stringify({
    email: 'nkdev26@gmail.com',
    password: 'password123',
    organizationId: '00000000-0000-0000-0000-000000000000'
});

const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Login Status:', res.statusCode);
        console.log('Response:', body);
    });
});

req.on('error', (e) => console.error(e.message));
req.write(data);
req.end();
