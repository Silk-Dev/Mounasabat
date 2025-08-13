/**
 * Deployment Configuration
 * Defines environment-specific deployment settings
 */

const deploymentConfig = {
  development: {
    database: {
      seedScripts: ['base', 'demo'],
      allowDemoData: true,
      validateAfterSeed: true,
    },
    monitoring: {
      enableEmptyStateTracking: true,
      enableErrorTracking: true,
      logLevel: 'debug',
    },
    features: {
      allowMockData: false,
      strictDataValidation: true,
    },
  },
  
  staging: {
    database: {
      seedScripts: ['base', 'demo'],
      allowDemoData: true,
      validateAfterSeed: true,
    },
    monitoring: {
      enableEmptyStateTracking: true,
      enableErrorTracking: true,
      logLevel: 'info',
    },
    features: {
      allowMockData: false,
      strictDataValidation: true,
    },
  },
  
  production: {
    database: {
      seedScripts: ['base'], // Only base seed in production
      allowDemoData: false,
      validateAfterSeed: true,
      requireBackupBeforeSeed: true,
    },
    monitoring: {
      enableEmptyStateTracking: true,
      enableErrorTracking: true,
      enablePerformanceTracking: true,
      logLevel: 'warn',
      alertOnEmptyStates: true,
      alertOnMissingData: true,
    },
    features: {
      allowMockData: false,
      strictDataValidation: true,
      enforceDataIntegrity: true,
    },
  },
  
  test: {
    database: {
      seedScripts: ['base', 'test'],
      allowDemoData: false,
      validateAfterSeed: false,
    },
    monitoring: {
      enableEmptyStateTracking: false,
      enableErrorTracking: false,
      logLevel: 'error',
    },
    features: {
      allowMockData: false,
      strictDataValidation: true,
    },
  },
};

/**
 * Get configuration for current environment
 */
function getConfig(environment = process.env.NODE_ENV || 'development') {
  const config = deploymentConfig[environment];
  
  if (!config) {
    throw new Error(`No deployment configuration found for environment: ${environment}`);
  }
  
  return {
    environment,
    ...config,
  };
}

/**
 * Validate environment configuration
 */
function validateConfig(config) {
  const required = ['database', 'monitoring', 'features'];
  
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required configuration section: ${key}`);
    }
  }
  
  // Production-specific validations
  if (config.environment === 'production') {
    if (config.database.allowDemoData) {
      throw new Error('Demo data is not allowed in production environment');
    }
    
    if (config.database.seedScripts.includes('demo')) {
      throw new Error('Demo seed script is not allowed in production environment');
    }
    
    if (config.features.allowMockData) {
      throw new Error('Mock data is not allowed in production environment');
    }
  }
  
  return true;
}

/**
 * Get seed scripts for current environment
 */
function getSeedScripts(environment = process.env.NODE_ENV || 'development') {
  const config = getConfig(environment);
  validateConfig(config);
  
  return config.database.seedScripts;
}

/**
 * Check if demo data is allowed in current environment
 */
function isDemoDataAllowed(environment = process.env.NODE_ENV || 'development') {
  const config = getConfig(environment);
  return config.database.allowDemoData;
}

/**
 * Check if monitoring is enabled for specific feature
 */
function isMonitoringEnabled(feature, environment = process.env.NODE_ENV || 'development') {
  const config = getConfig(environment);
  return config.monitoring[feature] || false;
}

module.exports = {
  deploymentConfig,
  getConfig,
  validateConfig,
  getSeedScripts,
  isDemoDataAllowed,
  isMonitoringEnabled,
};