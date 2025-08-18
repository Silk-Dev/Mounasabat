/**
 * Global teardown for real data tests
 * 
 * This file cleans up the test environment after real data tests complete.
 */

const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Clean up test database
    console.log('🗑️  Cleaning test database...');
    
    // Reset database to clean state
    execSync('npx prisma migrate reset --force --skip-seed', {
      cwd: path.join(__dirname, '../../../..', 'packages/database'),
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL
      }
    });
    
    console.log('✅ Test environment cleanup complete');
    
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
};