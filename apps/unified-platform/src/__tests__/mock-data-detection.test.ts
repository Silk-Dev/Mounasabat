/**
 * Mock Data Detection Test Suite
 * 
 * This test suite ensures that no hardcoded mock data exists in the codebase
 * and that all components properly handle real data scenarios.
 * 
 * Requirements: 7.1, 7.2, 7.4, 7.5
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

describe('Mock Data Detection', () => {
  const sourceDirectories = [
    'src/app',
    'src/components',
    'src/lib',
    'src/hooks'
  ];

  const mockDataPatterns = [
    // Common mock data variable names
    /mockServices/gi,
    /mockProviders/gi,
    /mockBookings/gi,
    /mockUsers/gi,
    /mockSearchResults/gi,
    /mockCategories/gi,
    /mockEvents/gi,
    /mockReviews/gi,
    
    // Hardcoded array patterns that look like mock data
    /const\s+\w*mock\w*\s*=\s*\[/gi,
    /const\s+\w+\s*=\s*\[\s*\{[^}]*id[^}]*name/gi,
    /const\s+\w+\s*=\s*\[\s*\{[^}]*name[^}]*id/gi,
    
    // Fallback to mock data patterns
    /\|\|\s*mockData/gi,
    /\?\s*mockData/gi,
    /fallback.*mock/gi,
    
    // Hardcoded service/provider objects
    /\{\s*id:\s*['"`]\w+['"`],\s*name:\s*['"`][^'"`]+['"`]/gi,
  ];

  const allowedMockPatterns = [
    // Allow mocks in test files
    /\.test\.(ts|tsx)$/,
    /\.spec\.(ts|tsx)$/,
    /__tests__/,
    /jest\.mock/,
    /mockImplementation/,
    /mockResolvedValue/,
    /mockRejectedValue/,
    
    // Allow mock in development utilities
    /seed/,
    /demo/,
    /example/,
  ];

  let sourceFiles: string[] = [];

  beforeAll(async () => {
    // Get all TypeScript/React files in source directories
    const patterns = sourceDirectories.map(dir => `${dir}/**/*.{ts,tsx}`);
    
    for (const pattern of patterns) {
      const files = await glob(pattern, { 
        cwd: process.cwd(),
        ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**']
      });
      sourceFiles.push(...files);
    }
  });

  it('should not contain hardcoded mock data arrays in source files', async () => {
    const violations: Array<{ file: string; line: number; content: string; pattern: string }> = [];

    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        for (const [index, line] of lines.entries()) {
          for (const pattern of mockDataPatterns) {
            if (pattern.test(line)) {
              // Check if this is an allowed mock pattern
              const isAllowed = allowedMockPatterns.some(allowedPattern => {
                if (allowedPattern instanceof RegExp) {
                  return allowedPattern.test(file) || allowedPattern.test(line);
                }
                return file.includes(allowedPattern) || line.includes(allowedPattern);
              });

              if (!isAllowed) {
                violations.push({
                  file,
                  line: index + 1,
                  content: line.trim(),
                  pattern: pattern.toString()
                });
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Could not read file ${file}:`, error);
      }
    }

    if (violations.length > 0) {
      const violationReport = violations
        .map(v => `${v.file}:${v.line} - "${v.content}" (matched pattern: ${v.pattern})`)
        .join('\n');
      
      throw new Error(`Found ${violations.length} potential mock data violations:\n${violationReport}`);
    }
  });

  it('should not contain fallback to mock data in search functionality', async () => {
    const searchFiles = await glob('src/**/*search*.{ts,tsx}', {
      cwd: process.cwd(),
      ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}']
    });

    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const file of searchFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        for (const [index, line] of lines.entries()) {
          // Look for patterns that suggest fallback to mock data
          if (
            /\|\|\s*mock/gi.test(line) ||
            /\?\s*mock/gi.test(line) ||
            /catch.*mock/gi.test(line) ||
            /fallback.*mock/gi.test(line)
          ) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim()
            });
          }
        }
      } catch (error) {
        console.warn(`Could not read file ${file}:`, error);
      }
    }

    if (violations.length > 0) {
      const violationReport = violations
        .map(v => `${v.file}:${v.line} - "${v.content}"`)
        .join('\n');
      
      throw new Error(`Found fallback to mock data in search files:\n${violationReport}`);
    }
  });

  it('should not contain hardcoded provider or service data', async () => {
    const componentFiles = await glob('src/components/**/*.{ts,tsx}', {
      cwd: process.cwd(),
      ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/examples/**']
    });

    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const file of componentFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Look for hardcoded arrays that look like service/provider data
        const hardcodedArrayPattern = /const\s+\w+\s*=\s*\[\s*\{[^}]*(?:id|name|email|phone)[^}]*\}/gi;
        const matches = content.match(hardcodedArrayPattern);
        
        if (matches) {
          const lines = content.split('\n');
          for (const [index, line] of lines.entries()) {
            if (hardcodedArrayPattern.test(line)) {
              violations.push({
                file,
                line: index + 1,
                content: line.trim()
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Could not read file ${file}:`, error);
      }
    }

    if (violations.length > 0) {
      const violationReport = violations
        .map(v => `${v.file}:${v.line} - "${v.content}"`)
        .join('\n');
      
      throw new Error(`Found hardcoded data arrays in components:\n${violationReport}`);
    }
  });

  it('should not contain TODO comments about removing mock data', async () => {
    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        for (const [index, line] of lines.entries()) {
          if (
            /TODO.*mock/gi.test(line) ||
            /FIXME.*mock/gi.test(line) ||
            /TODO.*remove.*hardcoded/gi.test(line)
          ) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim()
            });
          }
        }
      } catch (error) {
        console.warn(`Could not read file ${file}:`, error);
      }
    }

    if (violations.length > 0) {
      const violationReport = violations
        .map(v => `${v.file}:${v.line} - "${v.content}"`)
        .join('\n');
      
      console.warn(`Found TODO comments about mock data (should be resolved):\n${violationReport}`);
    }
  });

  it('should ensure all API routes return real data', async () => {
    const apiFiles = await glob('src/app/api/**/*.{ts,tsx}', {
      cwd: process.cwd(),
      ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}']
    });

    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        for (const [index, line] of lines.entries()) {
          // Look for hardcoded return values that look like mock data
          if (
            /return.*\{.*id.*name.*\}/gi.test(line) ||
            /Response\.json\(\[.*\{.*id/gi.test(line) ||
            /NextResponse\.json\(\[.*\{.*id/gi.test(line)
          ) {
            // Skip if it's clearly using database data
            if (
              !line.includes('prisma') &&
              !line.includes('database') &&
              !line.includes('query') &&
              !line.includes('find') &&
              !line.includes('create') &&
              !line.includes('update')
            ) {
              violations.push({
                file,
                line: index + 1,
                content: line.trim()
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Could not read file ${file}:`, error);
      }
    }

    if (violations.length > 0) {
      const violationReport = violations
        .map(v => `${v.file}:${v.line} - "${v.content}"`)
        .join('\n');
      
      throw new Error(`Found potential hardcoded API responses:\n${violationReport}`);
    }
  });
});