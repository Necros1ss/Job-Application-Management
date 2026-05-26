const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'db.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('');

// Find unbalanced parentheses by counting open/close
let parenDepth = 0;
let maxDepth = 0;
let maxDepthLine = 0;
let errorLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Count template literals (but need to track across lines)
  // Actually let's count parentheses
  for (const ch of line) {
    if (ch === '(') { parenDepth++; }
    if (ch === ')') { parenDepth--; }
  }
  
  // We track the parenthesis depth - it should never go negative
  // But when it's 0 and we close, that's fine
}

console.log('Final paren depth:', parenDepth);

// Now let's look at lines around 415-425
console.log('\nLines 414-422:');
for (let i = 413; i <= 421; i++) {
  console.log(`Line ${i+1} (${lines[i].length} chars):`, JSON.stringify(lines[i]));
}

// Count DO $$ blocks and their END $$
const doBlocks = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('DO $$')) {
    doBlocks.push({ line: i + 1, closed: false });
  }
  if (lines[i].includes('END $$')) {
    for (let j = doBlocks.length - 1; j >= 0; j--) {
      if (!doBlocks[j].closed) {
        doBlocks[j].closed = true;
        doBlocks[j].endLine = i + 1;
        break;
      }
    }
  }
}

console.log('\nDO blocks status:');
for (const b of doBlocks) {
  console.log(`  Line ${b.line} - ${b.closed ? 'closed at ' + b.endLine : 'UNCLOSED!'}`);
}

// Look at line 495 - it seems odd
console.log('\nLine 495 context:');
for (let i = 493; i <= 498; i++) {
  console.log(`Line ${i+1}:`, JSON.stringify(lines[i]));
}
