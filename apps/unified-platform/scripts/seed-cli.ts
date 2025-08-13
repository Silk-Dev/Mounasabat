#!/usr/bin/env tsx

import { Command } from "commander";
import { SeedManager } from "../src/seed-manager";

const program = new Command();
const seedManager = new SeedManager();

program
  .name("seed-cli")
  .description("Database seeding management CLI")
  .version("1.0.0");

program
  .command("base")
  .description("Run base seed with essential platform data")
  .option("-v, --verbose", "verbose output")
  .action(async (options) => {
    console.log("🌱 Running base seed...");
    const result = await seedManager.runBaseSeed({ verbose: options.verbose });
    
    if (result.success) {
      console.log("✅", result.message);
      if (result.counts) {
        console.log("\n📊 Database counts:");
        Object.entries(result.counts).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    } else {
      console.error("❌", result.message);
      if (result.error) {
        console.error("Error:", result.error);
      }
      process.exit(1);
    }
    
    await seedManager.disconnect();
  });

program
  .command("demo")
  .description("Run demo seed with sample data")
  .option("-v, --verbose", "verbose output")
  .option("-f, --force", "force demo seed in production (dangerous)")
  .action(async (options) => {
    console.log("🎭 Running demo seed...");
    const result = await seedManager.runDemoSeed({ 
      verbose: options.verbose,
      force: options.force 
    });
    
    if (result.success) {
      console.log("✅", result.message);
      if (result.counts) {
        console.log("\n📊 Database counts:");
        Object.entries(result.counts).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    } else {
      console.error("❌", result.message);
      if (result.error) {
        console.error("Error:", result.error);
      }
      process.exit(1);
    }
    
    await seedManager.disconnect();
  });

program
  .command("full")
  .description("Run full seed (base + optional demo)")
  .option("-d, --demo", "include demo data")
  .option("-v, --verbose", "verbose output")
  .option("-f, --force", "force demo seed in production (dangerous)")
  .action(async (options) => {
    console.log("🚀 Running full seed...");
    const result = await seedManager.runFullSeed({ 
      includeDemo: options.demo,
      verbose: options.verbose,
      force: options.force 
    });
    
    if (result.success) {
      console.log("✅", result.message);
      if (result.counts) {
        console.log("\n📊 Database counts:");
        Object.entries(result.counts).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    } else {
      console.error("❌", result.message);
      if (result.error) {
        console.error("Error:", result.error);
      }
      process.exit(1);
    }
    
    await seedManager.disconnect();
  });

program
  .command("clear-demo")
  .description("Clear all demo data from database")
  .action(async () => {
    console.log("🧹 Clearing demo data...");
    const result = await seedManager.clearDemoData();
    
    if (result.success) {
      console.log("✅", result.message);
      if (result.counts) {
        console.log("\n📊 Remaining database counts:");
        Object.entries(result.counts).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    } else {
      console.error("❌", result.message);
      if (result.error) {
        console.error("Error:", result.error);
      }
      process.exit(1);
    }
    
    await seedManager.disconnect();
  });

program
  .command("validate")
  .description("Validate seed data integrity")
  .action(async () => {
    console.log("🔍 Validating seed data...");
    const result = await seedManager.validateSeedData();
    
    if (result.success) {
      console.log("✅", result.message);
      if (result.counts) {
        console.log("\n📊 Database counts:");
        Object.entries(result.counts).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    } else {
      console.error("❌", result.message);
      if (result.error) {
        console.error("Validation errors:", result.error);
      }
      process.exit(1);
    }
    
    await seedManager.disconnect();
  });

program
  .command("status")
  .description("Check database seeding status and get recommendations")
  .action(async () => {
    console.log("📊 Checking database status...");
    
    try {
      const status = await seedManager.getStatus();
      const counts = await seedManager.getCounts();
      
      console.log("\n🗄️  Database Status:");
      console.log(`  Empty: ${status.isEmpty ? "Yes" : "No"}`);
      console.log(`  Has Base Data: ${status.hasBaseData ? "Yes" : "No"}`);
      console.log(`  Has Demo Data: ${status.hasDemoData ? "Yes" : "No"}`);
      
      console.log("\n📊 Record Counts:");
      Object.entries(counts).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      if (status.recommendations.length > 0) {
        console.log("\n💡 Recommendations:");
        status.recommendations.forEach(rec => {
          console.log(`  • ${rec}`);
        });
      }
      
    } catch (error) {
      console.error("❌ Error checking status:", error);
      process.exit(1);
    }
    
    await seedManager.disconnect();
  });

program
  .command("counts")
  .description("Show database record counts")
  .action(async () => {
    console.log("📊 Getting database counts...");
    
    try {
      const counts = await seedManager.getCounts();
      
      console.log("\n📊 Database Record Counts:");
      Object.entries(counts).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
    } catch (error) {
      console.error("❌ Error getting counts:", error);
      process.exit(1);
    }
    
    await seedManager.disconnect();
  });

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await seedManager.disconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  await seedManager.disconnect();
  process.exit(1);
});

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}