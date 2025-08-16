#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Configuration
const SOURCE_DIR = 'src';
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/__tests__/**',
  '**/test/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/run-real-data-tests.ts', // Keep test runner console logs
  '**/test-utils.tsx', // Keep test utility console logs
];

const INCLUDE_PATTERNS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
];

// Replacement patterns
const REPLACEMENTS = [
  {
    pattern: /console\.log\((.*?)\);?/g,
    replacement: "logger.info($1);",
    import: "import { logger } from '@/lib/production-logger';"
  },
  {
    pattern: /console\.info\((.*?)\);?/g,
    replacement: "logger.info($1);",
    import: "import { logger } from '@/lib/production-logger';"
  },
  {
    pattern: /console\.warn\((.*?)\);?/g,
    replacement: "logger.warn($1);",
    import: "import { logger } from '@/lib/production-logger';"
  },
  {
    pattern: /console\.error\((.*?)\);?/g,
    replacement: "logger.error($1);",
    import: "import { logger } from '@/lib/production-logger';"
  },
  {
    pattern: /console\.debug\((.*?)\);?/g,
    replacement: "logger.debug($1);",
    import: "import { logger } from '@/lib/production-logger';"
  },
];

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    // Simple pattern matching for common cases
    if (pattern.includes('**/__tests__/**') && filePath.includes('__tests__')) return true;
    if (pattern.includes('**/test/**') && filePath.includes('/test/')) return true;
    if (pattern.includes('**/*.test.') && filePath.includes('.test.')) return true;
    if (pattern.includes('**/*.spec.') && filePath.includes('.spec.')) return true;
    if (pattern.includes('**/node_modules/**') && filePath.includes('node_modules')) return true;
    if (pattern.includes('run-real-data-tests.ts') && filePath.includes('run-real-data-tests.ts')) return true;
    if (pattern.includes('test-utils.tsx') && filePath.includes('test-utils.tsx')) return true;
    return false;
  });
}

function hasConsoleStatements(content) {
  return REPLACEMENTS.some(({ pattern }) => pattern.test(content));
}

function addLoggerImport(content, filePath) {
  // Check if logger import already exists
  if (content.includes("from '@/lib/production-logger'") || 
      content.includes("from '../lib/production-logger'") ||
      content.includes("from './production-logger'")) {
    return content;
  }

  // Find the best place to add the import
  const lines = content.split('\n');
  let insertIndex = 0;

  // Look for existing imports
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ') || line.startsWith("import{")) {
      insertIndex = i + 1;
    } else if (line === '' && insertIndex > 0) {
      // Found empty line after imports
      break;
    } else if (line && !line.startsWith('//') && !line.startsWith('/*') && insertIndex > 0) {
      // Found non-import, non-comment line
      break;
    }
  }

  // Determine the correct import path based on file location
  const relativePath = path.relative(path.dirname(filePath), path.join(SOURCE_DIR, 'lib'));
  let importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
  // Clean up double slashes
  importPath = importPath.replace(/\/+/g, '/');
  const loggerImport = `import { logger } from '${importPath}/production-logger';`;

  lines.splice(insertIndex, 0, loggerImport);
  return lines.join('\n');
}

function replaceConsoleStatements(content) {
  let modifiedContent = content;
  let hasChanges = false;

  REPLACEMENTS.forEach(({ pattern, replacement }) => {
    const originalContent = modifiedContent;
    modifiedContent = modifiedContent.replace(pattern, replacement);
    if (modifiedContent !== originalContent) {
      hasChanges = true;
    }
  });

  return { content: modifiedContent, hasChanges };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!hasConsoleStatements(content)) {
      return { processed: false, reason: 'No console statements found' };
    }

    const { content: replacedContent, hasChanges } = replaceConsoleStatements(content);
    
    if (!hasChanges) {
      return { processed: false, reason: 'No changes made' };
    }

    // Add logger import if needed
    const finalContent = addLoggerImport(replacedContent, filePath);

    // Write the modified content back to the file
    fs.writeFileSync(filePath, finalContent, 'utf8');
    
    return { processed: true, reason: 'Console statements replaced' };
  } catch (error) {
    return { processed: false, reason: `Error: ${error.message}` };
  }
}

function main() {
  console.log('🔍 Finding TypeScript/JavaScript files...');
  
  const allFiles = [];
  INCLUDE_PATTERNS.forEach(pattern => {
    const files = glob.sync(path.join(SOURCE_DIR, pattern), {
      ignore: EXCLUDE_PATTERNS.map(p => path.join(SOURCE_DIR, p))
    });
    allFiles.push(...files);
  });

  // Remove duplicates
  const uniqueFiles = [...new Set(allFiles)];
  
  console.log(`📁 Found ${uniqueFiles.length} files to process`);
  
  const results = {
    processed: 0,
    skipped: 0,
    errors: 0,
    files: []
  };

  uniqueFiles.forEach(filePath => {
    if (shouldExcludeFile(filePath)) {
      results.skipped++;
      return;
    }

    const result = processFile(filePath);
    results.files.push({ filePath, ...result });
    
    if (result.processed) {
      results.processed++;
      console.log(`✅ ${filePath}: ${result.reason}`);
    } else if (result.reason.startsWith('Error:')) {
      results.errors++;
      console.log(`❌ ${filePath}: ${result.reason}`);
    } else {
      results.skipped++;
      // Don't log skipped files to reduce noise
    }
  });

  console.log('\n📊 Summary:');
  console.log(`✅ Processed: ${results.processed} files`);
  console.log(`⏭️  Skipped: ${results.skipped} files`);
  console.log(`❌ Errors: ${results.errors} files`);

  if (results.processed > 0) {
    console.log('\n🎉 Console statements have been replaced with production logger!');
    console.log('📝 Please review the changes and test your application.');
  } else {
    console.log('\n✨ No console statements found that need replacement.');
  }

  // Exit with error code if there were errors
  if (results.errors > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, replaceConsoleStatements, addLoggerImport };