#!/usr/bin/env node

/**
 * Production Configuration Verification Script
 * Verifies that production deployment configuration is correct
 */

const fs = require('fs');
const path = require('path');
const { getConfig, validateConfig, getSeedScripts, isDemoDataAllowed } = require('../deployment.config.js');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

class ProductionConfigVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = 0;
    this.passed = 0;
  }

  check(condition, successMessage, errorMessage) {
    this.checks++;
    if (condition) {
      logSuccess(successMessage);
      this.passed++;
      return true;
    } else {
      logError(errorMessage);
      this.errors.push(errorMessage);
      return false;
    }
  }

  warn(condition, message) {
    if (!condition) {
      logWarning(message);
      this.warnings.push(message);
    }
  }

  /**
   * Verify deployment configuration
   */
  verifyDeploymentConfig() {
    logInfo('Verifying deployment configuration...');

    try {
      const prodConfig = getConfig('production');
      validateConfig(prodConfig);
      
      this.check(
        prodConfig.environment === 'production',
        'Production environment configuration loaded',
        'Failed to load production environment configuration'
      );

      this.check(
        !prodConfig.database.allowDemoData,
        'Demo data is disabled in production',
        'Demo data is allowed in production (SECURITY RISK)'
      );

      this.check(
        !prodConfig.features.allowMockData,
        'Mock data is disabled in production',
        'Mock data is allowed in production (SECURITY RISK)'
      );

      this.check(
        prodConfig.database.validateAfterSeed,
        'Seed validation is enabled in production',
        'Seed validation is disabled in production'
      );

      this.check(
        prodConfig.monitoring.enableEmptyStateTracking,
        'Empty state tracking is enabled',
        'Empty state tracking is disabled'
      );

      this.check(
        prodConfig.monitoring.enableErrorTracking,
        'Error tracking is enabled',
        'Error tracking is disabled'
      );

      this.check(
        prodConfig.monitoring.alertOnEmptyStates,
        'Empty state alerts are enabled',
        'Empty state alerts are disabled'
      );

      this.check(
        prodConfig.monitoring.alertOnMissingData,
        'Missing data alerts are enabled',
        'Missing data alerts are disabled'
      );

    } catch (error) {
      logError(`Deployment configuration error: ${error.message}`);
      this.errors.push(`Deployment configuration error: ${error.message}`);
    }
  }

  /**
   * Verify seed script configuration
   */
  verifySeedConfiguration() {
    logInfo('Verifying seed script configuration...');

    try {
      const prodSeedScripts = getSeedScripts('production');
      
      this.check(
        Array.isArray(prodSeedScripts),
        'Production seed scripts configuration is valid',
        'Production seed scripts configuration is invalid'
      );

      this.check(
        prodSeedScripts.includes('base'),
        'Base seed script is included in production',
        'Base seed script is missing from production configuration'
      );

      this.check(
        !prodSeedScripts.includes('demo'),
        'Demo seed script is excluded from production',
        'Demo seed script is included in production (SECURITY RISK)'
      );

      this.check(
        !isDemoDataAllowed('production'),
        'Demo data is not allowed in production',
        'Demo data is allowed in production (SECURITY RISK)'
      );

    } catch (error) {
      logError(`Seed configuration error: ${error.message}`);
      this.errors.push(`Seed configuration error: ${error.message}`);
    }
  }

  /**
   * Verify deployment scripts
   */
  verifyDeploymentScripts() {
    logInfo('Verifying deployment scripts...');

    const requiredFiles = [
      'scripts/deployment-pipeline.js',
      'scripts/monitoring-cron.js',
      'deployment.config.js',
      'PRODUCTION_DEPLOYMENT_CHECKLIST.md',
    ];

    for (const file of requiredFiles) {
      this.check(
        fs.existsSync(file),
        `Required file exists: ${file}`,
        `Required file missing: ${file}`
      );
    }

    // Check deployment pipeline script
    if (fs.existsSync('scripts/deployment-pipeline.js')) {
      const pipelineContent = fs.readFileSync('scripts/deployment-pipeline.js', 'utf8');
      
      this.check(
        pipelineContent.includes('NODE_ENV=production'),
        'Deployment pipeline handles production environment',
        'Deployment pipeline missing production environment handling'
      );

      this.check(
        pipelineContent.includes('getSeedScripts'),
        'Deployment pipeline uses environment-specific seed scripts',
        'Deployment pipeline not using environment-specific seed scripts'
      );
    }

    // Check GitHub Actions workflow
    const workflowPath = 'apps/unified-platform/.github/workflows/deploy.yml';
    if (fs.existsSync(workflowPath)) {
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      
      this.check(
        workflowContent.includes('NODE_ENV=production npm run seed base'),
        'GitHub Actions uses base seed only for production',
        'GitHub Actions workflow may include demo data in production'
      );

      this.check(
        workflowContent.includes('npm run seed validate'),
        'GitHub Actions validates seed data',
        'GitHub Actions workflow missing seed validation'
      );
    }

    // Check production deploy script
    const deployScriptPath = 'apps/unified-platform/scripts/production-deploy.sh';
    if (fs.existsSync(deployScriptPath)) {
      const deployContent = fs.readFileSync(deployScriptPath, 'utf8');
      
      this.check(
        deployContent.includes('npm run seed base'),
        'Production deploy script uses base seed only',
        'Production deploy script may include demo data'
      );

      this.check(
        deployContent.includes('npm run seed validate'),
        'Production deploy script validates seed data',
        'Production deploy script missing seed validation'
      );
    }
  }

  /**
   * Verify monitoring configuration
   */
  verifyMonitoringConfiguration() {
    logInfo('Verifying monitoring configuration...');

    // Check monitoring API endpoint
    const monitoringApiPath = 'apps/unified-platform/src/app/api/monitoring/route.ts';
    this.check(
      fs.existsSync(monitoringApiPath),
      'Monitoring API endpoint exists',
      'Monitoring API endpoint missing'
    );

    // Check monitoring system
    const monitoringSystemPath = 'packages/database/src/monitoring.ts';
    this.check(
      fs.existsSync(monitoringSystemPath),
      'Database monitoring system exists',
      'Database monitoring system missing'
    );

    // Check cron job script
    this.check(
      fs.existsSync('scripts/monitoring-cron.js'),
      'Monitoring cron job script exists',
      'Monitoring cron job script missing'
    );

    // Check if SystemAlert model exists in schema
    const schemaPath = 'packages/database/prisma/schema.prisma';
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      this.check(
        schemaContent.includes('model SystemAlert'),
        'SystemAlert model exists in database schema',
        'SystemAlert model missing from database schema'
      );
    }
  }

  /**
   * Verify package.json scripts
   */
  verifyPackageScripts() {
    logInfo('Verifying package.json scripts...');

    const packageJsonPath = 'package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};

      this.check(
        scripts['deploy:production'],
        'Production deployment script exists',
        'Production deployment script missing from package.json'
      );

      this.check(
        scripts['monitoring:check'],
        'Monitoring check script exists',
        'Monitoring check script missing from package.json'
      );

      this.check(
        scripts['monitoring:cron'],
        'Monitoring cron script exists',
        'Monitoring cron script missing from package.json'
      );
    }

    // Check database package scripts
    const dbPackageJsonPath = 'packages/database/package.json';
    if (fs.existsSync(dbPackageJsonPath)) {
      const dbPackageJson = JSON.parse(fs.readFileSync(dbPackageJsonPath, 'utf8'));
      const dbScripts = dbPackageJson.scripts || {};

      this.check(
        dbScripts['seed'],
        'Seed CLI script exists in database package',
        'Seed CLI script missing from database package.json'
      );

      this.check(
        dbScripts['db:migrate:deploy'],
        'Production migration script exists',
        'Production migration script missing from database package.json'
      );
    }
  }

  /**
   * Run all verification checks
   */
  runVerification() {
    log('🔍 Starting production configuration verification...', 'magenta');
    console.log();

    this.verifyDeploymentConfig();
    console.log();

    this.verifySeedConfiguration();
    console.log();

    this.verifyDeploymentScripts();
    console.log();

    this.verifyMonitoringConfiguration();
    console.log();

    this.verifyPackageScripts();
    console.log();

    // Summary
    log('📊 Verification Summary:', 'cyan');
    log(`Total Checks: ${this.checks}`);
    log(`Passed: ${this.passed}`, 'green');
    log(`Failed: ${this.errors.length}`, this.errors.length > 0 ? 'red' : 'green');
    log(`Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'yellow' : 'green');

    if (this.errors.length > 0) {
      console.log();
      log('❌ ERRORS:', 'red');
      this.errors.forEach(error => log(`  • ${error}`, 'red'));
    }

    if (this.warnings.length > 0) {
      console.log();
      log('⚠️  WARNINGS:', 'yellow');
      this.warnings.forEach(warning => log(`  • ${warning}`, 'yellow'));
    }

    console.log();
    if (this.errors.length === 0) {
      logSuccess('🎉 All production configuration checks passed!');
      return true;
    } else {
      logError('❌ Production configuration verification failed!');
      return false;
    }
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new ProductionConfigVerifier();
  const success = verifier.runVerification();
  process.exit(success ? 0 : 1);
}

module.exports = ProductionConfigVerifier;