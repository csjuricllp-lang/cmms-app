const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('CheckCircle2')) {
      const match = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
      if (match) {
        if (!match[1].includes('CheckCircle2')) {
          console.log('MISSING IMPORT IN:', filePath);
        }
      } else {
        console.log('NO LUCIDE IMPORT IN:', filePath);
      }
    }
  }
});
