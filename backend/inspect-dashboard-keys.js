const fs = require('fs');
const content = fs.readFileSync('c:\\cmms-juric\\cmms-app\\backend\\src\\analytics\\analytics.service.ts', 'utf8');
const lines = content.split('\n');

console.log('--- FINDING costMaintenance DEFINITION ---');
lines.forEach((line, idx) => {
  if (line.includes('const costMaintenance') || line.includes('costMaintenance:')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

// Let's print lines 250 to 300 to see where it gets calculated
console.log('\n--- PRINTING lines 250 to 300 ---');
for (let i = 250; i < Math.min(300, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
