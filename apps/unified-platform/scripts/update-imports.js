#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define import mappings
const importMappings = {
  '@mounasabet/database': '@/lib/database/prisma',
  '@mounasabet/database/src/monitoring': '@/lib/database/monitoring',
  '@mounasabet/ui': '@/components/ui',
  '@mounasabet/types': '@/lib/types',
  '@mounasabet/pricing': '@/lib/pricing',
  '@mounasabet/utils': '@/lib/utils',
};

function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Update imports
  for (const [oldImport, newImport] of Object.entries(importMappings)) {
    const regex = new RegExp(`from ['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, `from '${newImport}'`);
      updated = true;
    }

    // Also handle import statements
    const importRegex = new RegExp(`import\\s+.*\\s+from\\s+['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    if (content.match(importRegex)) {
      content = content.replace(importRegex, (match) => {
        return match.replace(`'${oldImport}'`, `'${newImport}'`).replace(`"${oldImport}"`, `"${newImport}"`);
      });
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in: ${filePath}`);
  }
}

// Find all TypeScript and TSX files
const files = glob.sync('apps/unified-platform/src/**/*.{ts,tsx}', { ignore: ['**/node_modules/**'] });

console.log(`Found ${files.length} files to process...`);

files.forEach(updateImports);

console.log('Import updates completed!');