#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

import { SeedManager } from "../src/seed-manager";

const prisma = new PrismaClient();
const seedManager = new SeedManager(prisma);

/**
 * Validation script to test the seeding infrastructure
 * This script validates that all seed operations work correctly
 */
async function validateSeeds() {
  console.log("🔍 Starting seed validation...");

  try {
    // Test 1: Validate base seed
    console.log("\n1️⃣ Testing base seed...");
    const baseResult = await seedManager.runBaseSeed({ verbose: false });
    
    if (!baseResult.success) {
      throw new Error(`Base seed failed: ${baseResult.error}`);
    }
    
    console.log("✅ Base seed validation passed");

    // Test 2: Validate seed data integrity
    console.log("\n2️⃣ Testing seed data validation...");
    const validationResult = await seedManager.validateSeedData();
    
    if (!validationResult.success) {
      throw new Error(`Seed validation failed: ${validationResult.error}`);
    }
    
    console.log("✅ Seed data validation passed");

    // Test 3: Test demo seed (if not in production)
    if (process.env.NODE_ENV !== "production") {
      console.log("\n3️⃣ Testing demo seed...");
      const demoResult = await seedManager.runDemoSeed({ verbose: false });
      
      if (!demoResult.success) {
        throw new Error(`Demo seed failed: ${demoResult.error}`);
      }
      
      console.log("✅ Demo seed validation passed");

      // Test 4: Test demo data clearing
      console.log("\n4️⃣ Testing demo data clearing...");
      const clearResult = await seedManager.clearDemoData();
      
      if (!clearResult.success) {
        throw new Error(`Demo data clearing failed: ${clearResult.error}`);
      }
      
      console.log("✅ Demo data clearing validation passed");
    } else {
      console.log("\n3️⃣ Skipping demo seed tests in production environment");
    }

    // Test 5: Test status checking
    console.log("\n5️⃣ Testing status checking...");
    const status = await seedManager.getStatus();
    
    if (!status.hasBaseData) {
      throw new Error("Status check failed: Base data not detected");
    }
    
    console.log("✅ Status checking validation passed");

    // Test 6: Test counts
    console.log("\n6️⃣ Testing count retrieval...");
    const counts = await seedManager.getCounts();
    
    if (counts.users === 0) {
      throw new Error("Count validation failed: No users found");
    }
    
    if (counts.templates === 0) {
      throw new Error("Count validation failed: No templates found");
    }
    
    console.log("✅ Count retrieval validation passed");

    // Final validation
    console.log("\n🎯 Running final validation...");
    const finalValidation = await seedManager.validateSeedData();
    
    if (!finalValidation.success) {
      throw new Error(`Final validation failed: ${finalValidation.error}`);
    }

    console.log("✅ All seed validation tests passed!");
    
    // Display final summary
    console.log("\n📊 Final Database State:");
    if (finalValidation.counts) {
      Object.entries(finalValidation.counts).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }

    console.log("\n🎉 Seed infrastructure validation completed successfully!");

  } catch (error) {
    console.error("\n❌ Seed validation failed:", error);
    process.exit(1);
  } finally {
    await seedManager.disconnect();
  }
}

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

// Run validation
validateSeeds();