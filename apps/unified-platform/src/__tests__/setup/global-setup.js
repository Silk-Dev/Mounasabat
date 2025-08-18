/**
 * Global setup for real data tests
 * 
 * This file sets up the test environment for real data tests,
 * ensuring that we have a clean database state for testing.
 */

const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('🔧 Setting up real data test environment...');
  
  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/mounasabet_test';
    
    // Ensure test database exists and is clean
    console.log('📦 Preparing test database...');
    
    // Run database migrations for test environment
    execSync('npx prisma migrate deploy', {
      cwd: path.join(__dirname),
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL
      }
    });
    
    // Run base seed only (no demo data for real data tests)
    console.log('🌱 Seeding base data...');
    execSync('npx prisma db seed -- --base-only', {
      cwd: path.join(__dirname),
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL
      }
    });
    
    console.log('✅ Test environment setup complete');
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
};