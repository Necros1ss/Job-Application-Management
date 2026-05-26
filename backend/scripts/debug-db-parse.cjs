const fs = require('fs');
const acorn = require('acorn');
const code = fs.readFileSync('db.js', 'utf8');

// Check template literals properly
let inTemplate = false;
let templateStarts = [];

for (let i = 0; i < code.length; i++) {
  if (code[i] === '`') {
    if (!inTemplate) {
      inTemplate = true;
      templateStarts.push(i);
    } else {
      inTemplate = false;
      templateStarts.pop();
    }
  }
  // Skip escaped backticks
  if (inTemplate && code[i] === '\\' && code[i+1] === '`') {
    i++;
  }
}

console.log('Unclosed templates:', templateStarts.length);
for (const pos of templateStarts) {
  const lineNum = code.substring(0, pos).split('\n').length;
  const ctx = code.substring(Math.max(0, pos-30), Math.min(code.length, pos+50));
  console.log(`  At char ${pos}, line ${lineNum}:`);
  console.log('  Context:', JSON.stringify(ctx));
}

// Now try acorn with more detail
try {
  acorn.parse(code, { sourceType: 'module', ecmaVersion: 2022 });
  console.log('\nParse succeeded!');
} catch(e) {
  console.log('\nParse error:', e.message);
  console.log('Location:', e.loc.line + ':' + e.loc.column);
  const lines = code.split('\n');
  const lineIdx = e.loc.line - 1;
  for (let i = Math.max(0, lineIdx-3); i <= Math.min(lines.length-1, lineIdx+3); i++) {
    console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
  }
}
