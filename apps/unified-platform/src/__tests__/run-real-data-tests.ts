/**
 * Real Data Test Runner
 * 
 * This script runs all tests related to ensuring no mock data exists
 * and that the application properly handles real data scenarios.
 * 
 * Requirements: 7.1, 7.2, 7.4, 7.5
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

interface TestResult {
  testSuite: string;
  passed: boolean;
  output: string;
  duration: number;
}

class RealDataTestRunner {
  private results: TestResult[] = [];
  private readonly testSuites = [
    {
      name: 'Mock Data Detection',
      file: 'mock-data-detection.test.ts',
      description: 'Detects hardcoded mock data in source files'
    },
    {
      name: 'Empty Database Integration',
      file: 'integration/empty-database.test.tsx',
      description: 'Tests application behavior with empty database'
    },
    {
      name: 'Empty State Handling',
      file: 'empty-state-handling.test.tsx',
      description: 'Verifies proper empty state UI handling'
    },
    {
      name: 'Error Scenarios',
      file: 'error-scenarios.test.tsx',
      description: 'Tests error handling without mock fallbacks'
    }
  ];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Real Data Test Suite');
    console.log('=====================================\n');

    for (const testSuite of this.testSuites) {
      await this.runTestSuite(testSuite);
    }

    this.generateReport();
  }

  private async runTestSuite(testSuite: { name: string; file: string; description: string }): Promise<void> {
    console.log(`📋 Running: ${testSuite.name}`);
    console.log(`   ${testSuite.description}`);
    
    const startTime = Date.now();
    
    try {
      const testPath = path.join(__dirname, testSuite.file);
      
      // Check if test file exists
      if (!fs.existsSync(testPath)) {
        throw new Error(`Test file not found: ${testPath}`);
      }

      // Run the test using Jest
      const output = execSync(
        `npx jest ${testPath} --verbose --no-cache --detectOpenHandles`,
        { 
          encoding: 'utf-8',
          cwd: process.cwd(),
          timeout: 60000 // 60 second timeout
        }
      );

      const duration = Date.now() - startTime;
      
      this.results.push({
        testSuite: testSuite.name,
        passed: true,
        output,
        duration
      });

      console.log(`   ✅ PASSED (${duration}ms)\n`);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        testSuite: testSuite.name,
        passed: false,
        output: error.message,
        duration
      });

      console.log(`   ❌ FAILED (${duration}ms)`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  private generateReport(): void {
    console.log('📊 Test Results Summary');
    console.log('=======================\n');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Test Suites: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Total Duration: ${totalDuration}ms\n`);

    // Detailed results
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} ${result.testSuite} (${result.duration}ms)`);
      
      if (!result.passed) {
        console.log(`   Error Details:`);
        console.log(`   ${result.output.split('\n').slice(0, 5).join('\n   ')}`);
        console.log('');
      }
    });

    // Generate recommendations
    this.generateRecommendations();

    // Exit with appropriate code
    if (failedTests > 0) {
      console.log('❌ Some tests failed. Please review the issues above.');
      process.exit(1);
    } else {
      console.log('🎉 All real data tests passed! The application is free of mock data.');
      process.exit(0);
    }
  }

  private generateRecommendations(): void {
    console.log('\n💡 Recommendations');
    console.log('==================\n');

    const failedSuites = this.results.filter(r => !r.passed);
    
    if (failedSuites.length === 0) {
      console.log('✨ Excellent! Your application properly handles real data scenarios.');
      console.log('   - No hardcoded mock data detected');
      console.log('   - Empty states are properly handled');
      console.log('   - Error scenarios don\'t fall back to mock data');
      console.log('   - Database integration works with empty data\n');
      return;
    }

    failedSuites.forEach(suite => {
      console.log(`🔧 ${suite.testSuite} Issues:`);
      
      switch (suite.testSuite) {
        case 'Mock Data Detection':
          console.log('   - Remove hardcoded arrays from components');
          console.log('   - Replace mock data with database queries');
          console.log('   - Remove fallback to mock data in error cases');
          break;
          
        case 'Empty Database Integration':
          console.log('   - Ensure APIs work with empty database');
          console.log('   - Fix database query implementations');
          console.log('   - Add proper error handling for missing data');
          break;
          
        case 'Empty State Handling':
          console.log('   - Add empty state components');
          console.log('   - Ensure components handle empty arrays gracefully');
          console.log('   - Remove mock data from empty state fallbacks');
          break;
          
        case 'Error Scenarios':
          console.log('   - Remove mock data fallbacks in error handlers');
          console.log('   - Add proper error state components');
          console.log('   - Ensure network errors don\'t show mock data');
          break;
      }
      console.log('');
    });
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const runner = new RealDataTestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export default RealDataTestRunner;