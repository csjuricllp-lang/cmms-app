const http = require('http');

console.log('Testing connectivity to http://127.0.0.1:3000...');

const req = http.get('http://127.0.0.1:3000', (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Root Status:', res.statusCode);
        console.log('Root Response:', body);
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error(`Connectivity Error: ${e.message}`);
    process.exit(1);
});

// Timeout after 5s
setTimeout(() => {
    console.error('Request Timed Out');
    process.exit(1);
}, 5000);
