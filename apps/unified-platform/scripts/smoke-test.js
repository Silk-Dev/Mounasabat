#!/usr/bin/env node

/**
 * Smoke tests for production deployment
 * These tests verify that the basic functionality works after deployment
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const isHttps = BASE_URL.startsWith('https');
const client = isHttps ? https : http;

console.log(`🔍 Running smoke tests against ${BASE_URL}`);

// Test configuration
const tests = [
  {
    name: 'Homepage',
    path: '/',
    expectedStatus: 200,
    timeout: 5000,
  },
  {
    name: 'Health Check',
    path: '/api/health',
    expectedStatus: 200,
    timeout: 3000,
    validateResponse: (data) => {
      const health = JSON.parse(data);
      return health.status === 'healthy' || health.status === 'degraded';
    },
  },
  {
    name: 'Search API',
    path: '/api/search?q=wedding&location=Tunis',
    expectedStatus: 200,
    timeout: 5000,
    validateResponse: (data) => {
      const result = JSON.parse(data);
      return Array.isArray(result.results);
    },
  },
  {
    name: 'Auth API',
    path: '/api/auth/session',
    expectedStatus: [200, 401], // Both are valid responses
    timeout: 3000,
  },
  {
    name: 'Categories API',
    path: '/api/categories',
    expectedStatus: 200,
    timeout: 3000,
    validateResponse: (data) => {
      const result = JSON.parse(data);
      return Array.isArray(result);
    },
  },
];

// Helper function to make HTTP requests
function makeRequest(path, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      timeout,
      headers: {
        'User-Agent': 'Smoke-Test/1.0',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.end();
  });
}

// Run a single test
async function runTest(test) {
  const startTime = Date.now();
  
  try {
    console.log(`  Testing ${test.name}...`);
    
    const response = await makeRequest(test.path, test.timeout);
    const duration = Date.now() - startTime;
    
    // Check status code
    const expectedStatuses = Array.isArray(test.expectedStatus) 
      ? test.expectedStatus 
      : [test.expectedStatus];
    
    if (!expectedStatuses.includes(response.status)) {
      throw new Error(`Expected status ${test.expectedStatus}, got ${response.status}`);
    }
    
    // Validate response if validator provided
    if (test.validateResponse) {
      try {
        const isValid = test.validateResponse(response.data);
        if (!isValid) {
          throw new Error('Response validation failed');
        }
      } catch (error) {
        throw new Error(`Response validation error: ${error.message}`);
      }
    }
    
    console.log(`  ✅ ${test.name} passed (${duration}ms)`);
    return { success: true, duration, test: test.name };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`  ❌ ${test.name} failed: ${error.message} (${duration}ms)`);
    return { success: false, duration, test: test.name, error: error.message };
  }
}

// Run all tests
async function runSmokeTests() {
  console.log('🚀 Starting smoke tests...\n');
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Test Results:');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.test}: ${r.error}`));
  }
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`\n⏱️  Total duration: ${totalDuration}ms`);
  
  // Exit with error code if any tests failed
  if (failed > 0) {
    console.log('\n💥 Smoke tests failed!');
    process.exit(1);
  } else {
    console.log('\n🎉 All smoke tests passed!');
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Run the tests
runSmokeTests();