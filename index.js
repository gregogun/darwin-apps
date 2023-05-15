const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mainPath = path.join(__dirname, './packages/app-wrapper/main.js');
const originalMain = fs.readFileSync(mainPath, 'utf-8');
const lines = originalMain.split('\n');

const newValue = 'bGHZDXBlRxhtR6e_x25aMhhp8CEdtrz8Vhy-oS4FzSI';

const updatedLines = lines.map((line) => {
  if (line.includes('let txid;')) {
    return `let txid = '${newValue}';`;
  }
  return line;
});

const updatedMain = updatedLines.join('\n');
fs.writeFileSync(mainPath, updatedMain, 'utf-8');

// run build for the app wrapper
const packagePath = path.dirname(mainPath);
const output = execSync('pnpm run build', {
  cwd: packagePath,
  encoding: 'utf-8',
});

console.log(output);

// deploy

fs.writeFileSync(mainPath, originalMain, 'utf-8');
