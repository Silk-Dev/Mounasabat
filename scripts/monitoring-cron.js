#!/usr/bin/env node

/**
 * Monitoring Cron Job
 * Runs database monitoring checks on a schedule
 */

const { PrismaClient } = require('@prisma/client');
const { runMonitoringCheck } = require('../packages/database/src/monitoring');
const { isMonitoringEnabled } = require('../deployment.config.js');

const prisma = new PrismaClient();

async function runCronJob() {
  const environment = process.env.NODE_ENV || 'development';
  
  console.log(`🔍 Running monitoring cron job for ${environment} environment...`);
  
  try {
    // Check if monitoring is enabled
    if (!isMonitoringEnabled('enableEmptyStateTracking', environment) && 
        !isMonitoringEnabled('enableErrorTracking', environment)) {
      console.log('⏭️  Monitoring is disabled for this environment, skipping...');
      return;
    }

    // Run monitoring check
    const metrics = await runMonitoringCheck(prisma, environment);
    
    // Log results
    console.log('📊 Monitoring Results:');
    console.log(`  Environment: ${metrics.environment}`);
    console.log(`  Timestamp: ${metrics.timestamp.toISOString()}`);
    console.log(`  Empty States: ${metrics.emptyStates.length}`);
    console.log(`  Missing Data: ${metrics.missingData.length}`);
    console.log(`  Warnings: ${metrics.warnings.length}`);
    console.log(`  Errors: ${metrics.errors.length}`);
    
    // Log details if there are issues
    if (metrics.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      metrics.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (metrics.emptyStates.length > 0) {
      console.log('\n⚠️  EMPTY STATES:');
      metrics.emptyStates.forEach(state => console.log(`  • ${state}`));
    }
    
    if (metrics.missingData.length > 0) {
      console.log('\n🔍 MISSING DATA:');
      metrics.missingData.forEach(data => console.log(`  • ${data}`));
    }
    
    if (metrics.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      metrics.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    // Log database counts
    console.log('\n📊 DATABASE COUNTS:');
    Object.entries(metrics.counts).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n✅ Monitoring cron job completed successfully');
    
  } catch (error) {
    console.error('❌ Monitoring cron job failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the cron job
if (require.main === module) {
  runCronJob();
}

module.exports = { runCronJob };