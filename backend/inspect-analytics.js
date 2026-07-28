const fs = require('fs');
const content = fs.readFileSync('c:\\cmms-juric\\cmms-app\\backend\\src\\analytics\\analytics.service.ts', 'utf8');
const lines = content.split('\n');

console.log('--- ANALYTICS SERVICE STRUCTURE ---');
lines.forEach((line, idx) => {
  if (line.includes('async ') || line.includes('getDashboardStats')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
