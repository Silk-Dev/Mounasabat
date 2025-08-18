import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const searchQueries = [
  'wedding venue',
  'catering service',
  'photography',
  'event planning',
  'decoration',
  'entertainment',
];

const locations = [
  'Tunis',
  'Sfax',
  'Sousse',
  'Kairouan',
];

export default function () {
  // Test homepage
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in <2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(1);

  // Test search functionality
  const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  const location = locations[Math.floor(Math.random() * locations.length)];
  
  response = http.get(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
  check(response, {
    'search API status is 200': (r) => r.status === 200,
    'search API responds in <1s': (r) => r.timings.duration < 1000,
    'search returns results': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data.results);
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test provider profile page
  response = http.get(`${BASE_URL}/providers/1`);
  check(response, {
    'provider page status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'provider page loads in <2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(1);

  // Test health check endpoint
  response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check responds in <500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(2);
}

// Setup function (runs once per VU)
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  
  // Verify the application is running
  const response = http.get(`${BASE_URL}/api/health`);
  if (response.status !== 200) {
    throw new Error(`Application not ready. Health check returned ${response.status}`);
  }
  
  return { baseUrl: BASE_URL };
}

// Teardown function (runs once after all VUs finish)
export function teardown(data) {
  console.log('Load test completed');
}