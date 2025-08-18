/**
 * Production Data Validation Tests
 * 
 * This test suite ensures that no hardcoded mock data exists in production code
 * and that all data comes from the database or external APIs.
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

describe('Production Data Validation', () => {
  const srcDir = path.join(__dirname, '..');
  
  // Patterns that indicate hardcoded mock data
  const mockDataPatterns = [
    // Hardcoded arrays with object literals
    /const\s+\w*[Mm]ock\w*\s*=\s*\[/g,
    /const\s+\w*[Ff]allback\w*\s*=\s*\[/g,
    
    // Hardcoded location data (specific to our app)
    /\[\s*['"]Tunis['"],\s*['"]Sfax['"],\s*['"]Sousse['"]/g,
    
    // Fallback to hardcoded data patterns
    /\|\|\s*\[.*\{.*name.*:/g,
    /\?\s*\[.*\{.*id.*:/g,
    
    // Common mock data variable names
    /mockServices|mockProviders|mockCategories|mockLocations/g,
    
    // Hardcoded company information (should use env vars)
    /['"]Mounasabet Event Services['"]|['"]123 Business Street['"]/g,
  ];

  // Files to exclude from checks (test files, config files, etc.)
  const excludePatterns = [
    '**/*.test.*',
    '**/__tests__/**',
    '**/tests/**',
    '**/node_modules/**',
    '**/*.config.*',
    '**/prisma/seed*',
    '**/generated/**',
    '**/lib/database/seed-manager.ts', // Legitimate seed data
  ];

  it('should not contain hardcoded mock data in production code', async () => {
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: srcDir,
      ignore: excludePatterns,
    });

    const violations: Array<{ file: string; line: number; content: string; pattern: string }> = [];

    for (const file of files) {
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const [index, line] of lines.entries()) {
        for (const pattern of mockDataPatterns) {
          pattern.lastIndex = 0; // Reset regex state
          if (pattern.test(line)) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim(),
              pattern: pattern.source,
            });
          }
        }
      }
    }

    if (violations.length > 0) {
      const violationMessages = violations.map(v => 
        `${v.file}:${v.line} - "${v.content}" (matches pattern: ${v.pattern})`
      ).join('\n');
      
      throw new Error(`Found hardcoded mock data in production code:\n${violationMessages}`);
    }
  });

  it('should use environment variables for company information', async () => {
    const files = await glob('**/api/**/*.{ts,tsx}', {
      cwd: srcDir,
      ignore: excludePatterns,
    });

    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const file of files) {
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const [index, line] of lines.entries()) {
        // Check for hardcoded company info that should use env vars
        if (
          line.includes('Mounasabet Event Services') ||
          line.includes('123 Business Street') ||
          line.includes('billing@mounasabet.com')
        ) {
          // Allow if it's using process.env
          if (!line.includes('process.env')) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim(),
            });
          }
        }
      }
    }

    if (violations.length > 0) {
      const violationMessages = violations.map(v => 
        `${v.file}:${v.line} - "${v.content}"`
      ).join('\n');
      
      throw new Error(`Found hardcoded company information that should use environment variables:\n${violationMessages}`);
    }
  });

  it('should not have fallback to hardcoded location data', async () => {
    const files = await glob('**/components/**/*.{ts,tsx}', {
      cwd: srcDir,
      ignore: excludePatterns,
    });

    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const file of files) {
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const [index, line] of lines.entries()) {
        // Check for hardcoded Tunisian cities (our specific case)
        if (
          line.includes('Tunis') && 
          line.includes('Sfax') && 
          line.includes('Sousse') &&
          !line.includes('// Test data') &&
          !line.includes('* Test') &&
          !line.includes('test')
        ) {
          violations.push({
            file,
            line: index + 1,
            content: line.trim(),
          });
        }
      }
    }

    if (violations.length > 0) {
      const violationMessages = violations.map(v => 
        `${v.file}:${v.line} - "${v.content}"`
      ).join('\n');
      
      throw new Error(`Found hardcoded location data that should come from database:\n${violationMessages}`);
    }
  });

  it('should handle empty states without placeholder data', async () => {
    const files = await glob('**/components/**/*.{ts,tsx}', {
      cwd: srcDir,
      ignore: excludePatterns,
    });

    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const file of files) {
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for patterns that suggest fallback to mock data in error scenarios
      const problematicPatterns = [
        /\|\|\s*mockData/g,
        /\?\s*mockData/g,
        /catch.*mockData/g,
        /error.*mockData/g,
      ];

      const lines = content.split('\n');
      for (const [index, line] of lines.entries()) {
        for (const pattern of problematicPatterns) {
          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim(),
            });
          }
        }
      }
    }

    if (violations.length > 0) {
      const violationMessages = violations.map(v => 
        `${v.file}:${v.line} - "${v.content}"`
      ).join('\n');
      
      throw new Error(`Found fallback to mock data in error scenarios:\n${violationMessages}`);
    }
  });

  it('should ensure all search results come from database queries', async () => {
    const searchFiles = await glob('**/search/**/*.{ts,tsx}', {
      cwd: srcDir,
      ignore: excludePatterns,
    });

    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const file of searchFiles) {
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check that search components use database queries, not hardcoded results
      if (content.includes('const results = [') && !content.includes('prisma') && !content.includes('fetch')) {
        const lines = content.split('\n');
        for (const [index, line] of lines.entries()) {
          if (line.includes('const results = [')) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim(),
            });
          }
        }
      }
    }

    if (violations.length > 0) {
      const violationMessages = violations.map(v => 
        `${v.file}:${v.line} - "${v.content}"`
      ).join('\n');
      
      throw new Error(`Found hardcoded search results that should come from database:\n${violationMessages}`);
    }
  });
});