module.exports = (results) => {
  // Custom test results processor
  const { testResults, numTotalTests, numPassedTests, numFailedTests } = results;
  
  console.log(`\n📊 Test Results Summary:`);
  console.log(`Total Tests: ${numTotalTests}`);
  console.log(`Passed: ${numPassedTests}`);
  console.log(`Failed: ${numFailedTests}`);
  
  if (numFailedTests > 0) {
    console.log(`\n❌ Failed Tests:`);
    testResults.forEach(testResult => {
      if (testResult.numFailingTests > 0) {
        console.log(`  - ${testResult.testFilePath}`);
        testResult.testResults.forEach(test => {
          if (test.status === 'failed') {
            console.log(`    • ${test.title}`);
          }
        });
      }
    });
  }
  
  return results;
};