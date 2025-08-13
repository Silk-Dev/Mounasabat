#!/usr/bin/env node

/**
 * Deployment Pipeline Script
 * Handles environment-specific deployment with proper seed script execution
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getConfig, validateConfig, getSeedScripts } = require('../deployment.config.js');

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

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
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

class DeploymentPipeline {
  constructor(environment = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.config = getConfig(environment);
    this.startTime = Date.now();
    
    // Validate configuration
    validateConfig(this.config);
    
    log(`🚀 Starting deployment pipeline for ${environment} environment`, 'magenta');
  }

  /**
   * Execute shell command with error handling
   */
  exec(command, options = {}) {
    try {
      logStep('EXEC', command);
      const result = execSync(command, {
        stdio: 'inherit',
        encoding: 'utf8',
        ...options,
      });
      return result;
    } catch (error) {
      logError(`Command failed: ${command}`);
      logError(error.message);
      throw error;
    }
  }

  /**
   * Check prerequisites
   */
  checkPrerequisites() {
    logStep('PREREQ', 'Checking prerequisites...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
    }
    
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      throw new Error('Not in project root directory');
    }
    
    // Check required environment variables for production
    if (this.environment === 'production') {
      const required = [
        'DATABASE_URL',
        'BETTER_AUTH_SECRET',
        'STRIPE_SECRET_KEY',
      ];
      
      for (const envVar of required) {
        if (!process.env[envVar]) {
          logWarning(`Missing environment variable: ${envVar}`);
        }
      }
    }
    
    logSuccess('Prerequisites check completed');
  }

  /**
   * Install dependencies
   */
  installDependencies() {
    logStep('DEPS', 'Installing dependencies...');
    this.exec('npm ci');
    logSuccess('Dependencies installed');
  }

  /**
   * Run tests
   */
  runTests() {
    logStep('TEST', 'Running tests...');
    
    // Skip tests in development if requested
    if (this.environment === 'development' && process.argv.includes('--skip-tests')) {
      logWarning('Skipping tests in development mode');
      return;
    }
    
    try {
      // Run unit tests
      this.exec('npm run test -- --run', { cwd: 'apps/unified-platform' });
      
      // Run integration tests for production
      if (this.environment === 'production') {
        this.exec('npm run test:integration -- --run', { cwd: 'apps/unified-platform' });
      }
      
      logSuccess('All tests passed');
    } catch (error) {
      logError('Tests failed');
      throw error;
    }
  }

  /**
   * Build application
   */
  buildApplication() {
    logStep('BUILD', 'Building application...');
    
    // Use production config for production builds
    if (this.environment === 'production') {
      const prodConfigPath = 'apps/unified-platform/next.config.prod.js';
      const configPath = 'apps/unified-platform/next.config.js';
      
      if (fs.existsSync(prodConfigPath)) {
        fs.copyFileSync(prodConfigPath, configPath);
        logStep('BUILD', 'Using production Next.js configuration');
      }
    }
    
    this.exec('npm run build');
    logSuccess('Application built successfully');
  }

  /**
   * Run database migrations
   */
  runMigrations() {
    logStep('DB', 'Running database migrations...');
    
    const dbPath = 'packages/database';
    
    // Run migrations
    this.exec('npm run db:migrate:deploy', { cwd: dbPath });
    
    // Run production setup for production environment
    if (this.environment === 'production') {
      this.exec('npm run db:setup:prod', { cwd: dbPath });
    }
    
    logSuccess('Database migrations completed');
  }

  /**
   * Seed database with environment-specific data
   */
  seedDatabase() {
    logStep('SEED', 'Seeding database...');
    
    const dbPath = 'packages/database';
    const seedScripts = getSeedScripts(this.environment);
    
    logStep('SEED', `Running seed scripts for ${this.environment}: ${seedScripts.join(', ')}`);
    
    // Ensure we don't run demo data in production
    if (this.environment === 'production' && seedScripts.includes('demo')) {
      throw new Error('Demo seed script is not allowed in production environment');
    }
    
    for (const script of seedScripts) {
      logStep('SEED', `Running ${script} seed...`);
      this.exec(`npm run seed ${script}`, { cwd: dbPath });
    }
    
    // Validate seed data
    if (this.config.database.validateAfterSeed) {
      logStep('SEED', 'Validating seed data...');
      this.exec('npm run seed validate', { cwd: dbPath });
    }
    
    logSuccess('Database seeding completed');
  }

  /**
   * Deploy application (environment-specific)
   */
  deployApplication() {
    logStep('DEPLOY', 'Deploying application...');
    
    // Ensure NODE_ENV is set correctly
    if (this.environment === 'production') {
      process.env.NODE_ENV = 'production';
      logStep('DEPLOY', 'NODE_ENV=production set for deployment');
    }
    
    switch (this.environment) {
      case 'production':
        this.deployToProduction();
        break;
      case 'staging':
        this.deployToStaging();
        break;
      case 'development':
        logStep('DEPLOY', 'Starting development server...');
        this.exec('npm run dev');
        break;
      default:
        logWarning(`No deployment strategy defined for ${this.environment}`);
    }
  }

  /**
   * Deploy to production
   */
  deployToProduction() {
    logStep('DEPLOY', 'Deploying to production...');
    
    // Check if Vercel CLI is available
    try {
      this.exec('vercel --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Vercel CLI not found. Please install it: npm install -g vercel');
    }
    
    // Deploy to Vercel
    this.exec('vercel --prod --yes', { cwd: 'apps/unified-platform' });
    
    logSuccess('Production deployment completed');
  }

  /**
   * Deploy to staging
   */
  deployToStaging() {
    logStep('DEPLOY', 'Deploying to staging...');
    
    // Deploy to staging environment
    this.exec('vercel --yes', { cwd: 'apps/unified-platform' });
    
    logSuccess('Staging deployment completed');
  }

  /**
   * Run post-deployment checks
   */
  runPostDeploymentChecks() {
    logStep('CHECK', 'Running post-deployment checks...');
    
    // Skip checks for development
    if (this.environment === 'development') {
      return;
    }
    
    // Wait for deployment to be ready
    if (this.environment === 'production' || this.environment === 'staging') {
      logStep('CHECK', 'Waiting for deployment to be ready...');
      setTimeout(() => {
        try {
          this.exec('npm run test:smoke', { cwd: 'apps/unified-platform' });
          logSuccess('Smoke tests passed');
        } catch (error) {
          logError('Smoke tests failed');
          throw error;
        }
      }, 30000);
    }
  }

  /**
   * Setup monitoring
   */
  setupMonitoring() {
    logStep('MONITOR', 'Setting up monitoring...');
    
    if (this.config.monitoring.enableEmptyStateTracking) {
      logStep('MONITOR', 'Empty state tracking enabled');
    }
    
    if (this.config.monitoring.enableErrorTracking) {
      logStep('MONITOR', 'Error tracking enabled');
    }
    
    if (this.config.monitoring.enablePerformanceTracking) {
      logStep('MONITOR', 'Performance tracking enabled');
    }
    
    // Create monitoring configuration
    const monitoringConfig = {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      config: this.config.monitoring,
    };
    
    fs.writeFileSync(
      'monitoring.config.json',
      JSON.stringify(monitoringConfig, null, 2)
    );
    
    logSuccess('Monitoring configuration created');
  }

  /**
   * Run the complete deployment pipeline
   */
  async run() {
    try {
      this.checkPrerequisites();
      this.installDependencies();
      this.runTests();
      this.buildApplication();
      this.runMigrations();
      this.seedDatabase();
      this.setupMonitoring();
      this.deployApplication();
      this.runPostDeploymentChecks();
      
      const duration = Math.round((Date.now() - this.startTime) / 1000);
      logSuccess(`🎉 Deployment pipeline completed successfully in ${duration}s`);
      
    } catch (error) {
      logError(`Deployment pipeline failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the pipeline if called directly
if (require.main === module) {
  const environment = process.argv[2] || process.env.NODE_ENV || 'development';
  const pipeline = new DeploymentPipeline(environment);
  pipeline.run();
}

module.exports = DeploymentPipeline;