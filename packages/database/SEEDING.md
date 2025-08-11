# Database Seeding Infrastructure

This document describes the comprehensive database seeding infrastructure for the Mounasabet platform.

## Overview

The seeding infrastructure provides a robust system for initializing and managing database data across different environments. It separates essential platform data from demo/development data to ensure production safety.

## Architecture

### Core Components

1. **Base Seed** (`prisma/seed-base.ts`) - Essential platform data
2. **Demo Seed** (`prisma/seed-demo.ts`) - Sample data for development/testing
3. **Seed Manager** (`src/seed-manager.ts`) - Centralized seeding operations
4. **CLI Tool** (`scripts/seed-cli.ts`) - Command-line interface
5. **Validation** (`scripts/validate-seeds.ts`) - Integrity testing

### Data Categories

#### Base Data (Production Safe)
- System administrator accounts
- Essential event templates (Wedding, Corporate, Birthday, Anniversary)
- Template items for each event type
- Basic product catalog (invitations, favor boxes)
- Customization options for products

#### Demo Data (Development Only)
- Sample customers and providers
- Realistic service offerings
- Sample events and bookings
- Reviews and ratings
- Conversations and messages
- Notifications and favorites

## Usage

### Command Line Interface

The seeding system provides a comprehensive CLI tool:

```bash
# Run base seed only (production safe)
npm run seed base

# Run demo seed only (development)
npm run seed demo

# Run full seed (base + demo)
npm run seed full --demo

# Clear demo data
npm run seed clear-demo

# Validate seed data integrity
npm run seed validate

# Check database status
npm run seed status

# Show record counts
npm run seed counts
```

### Direct Script Execution

```bash
# Base seed
npm run db:seed:base

# Demo seed
npm run db:seed:demo

# Default seed (uses seed manager)
npm run db:seed

# Validate seeding infrastructure
npm run seed:validate
```

### Programmatic Usage

```typescript
import { SeedManager } from '@mounasabet/database/src/seed-manager';

const seedManager = new SeedManager();

// Run base seed
const result = await seedManager.runBaseSeed();

// Run demo seed
const demoResult = await seedManager.runDemoSeed();

// Validate data
const validation = await seedManager.validateSeedData();

// Get status
const status = await seedManager.getStatus();
```

## Environment Configuration

### Environment Variables

- `NODE_ENV` - Controls production safety checks
- `INCLUDE_DEMO_DATA` - Controls demo data inclusion in default seed
- `DATABASE_URL` - Database connection string

### Environment Behavior

#### Production (`NODE_ENV=production`)
- Only base seed is allowed by default
- Demo seed requires `--force` flag
- Demo data clearing is disabled
- Automatic safety checks enabled

#### Development/Test
- All seeding operations allowed
- Demo data included by default
- Full validation available
- Data clearing enabled

## Data Structure

### Base Seed Creates

```
Admin Users: 1
├── System Administrator (admin@mounasabet.com)

Event Templates: 4
├── Wedding Celebration
├── Corporate Event
├── Birthday Party
└── Anniversary Celebration

Template Items: ~15
├── Photography services
├── Catering services
├── Venue requirements
├── Entertainment options
└── Decoration services

Essential Products: 2
├── Basic Event Invitations
└── Basic Favor Boxes

Customization Options: 2
├── Event Text customization
└── Color Theme options
```

### Demo Seed Adds

```
Sample Users: 6
├── 3 Customers
└── 3 Provider Users

Providers: 3
├── Photography service
├── Catering service
└── Decoration service

Services: 6
├── 2 Photography services
├── 2 Catering services
└── 2 Decoration services

Events: 3
├── Wedding event
├── Corporate event
└── Birthday event

Bookings: 3
Reviews: 4
Conversations: 2
Messages: 4
Favorites: 4
Notifications: 3
```

## Validation

### Automatic Validation

The system includes comprehensive validation:

- **Data Integrity**: Checks for orphaned records
- **Required Data**: Ensures essential data exists
- **Relationships**: Validates foreign key relationships
- **Counts**: Verifies expected record counts

### Manual Validation

```bash
# Run full validation suite
npm run seed:validate

# Check specific validation
npm run seed validate
```

### Validation Checks

1. ✅ Admin user exists
2. ✅ Essential templates present
3. ✅ Template items created
4. ✅ Essential products available
5. ✅ No orphaned records
6. ✅ Proper relationships maintained

## Safety Features

### Production Protection

- Demo seed blocked in production
- Confirmation required for destructive operations
- Environment-specific behavior
- Automatic safety checks

### Data Integrity

- Upsert operations prevent duplicates
- Foreign key validation
- Orphaned record detection
- Relationship consistency checks

### Error Handling

- Comprehensive error reporting
- Transaction rollback on failures
- Detailed error messages
- Graceful degradation

## Troubleshooting

### Common Issues

#### "Demo seed not allowed in production"
```bash
# Force demo seed in production (dangerous)
npm run seed demo --force
```

#### "Validation failed: Essential templates missing"
```bash
# Run base seed to create templates
npm run seed base
```

#### "Database connection error"
```bash
# Check DATABASE_URL environment variable
echo $DATABASE_URL

# Test database connection
npm run db:studio
```

### Debugging

#### Enable Verbose Output
```bash
npm run seed base --verbose
```

#### Check Database Status
```bash
npm run seed status
```

#### Validate Data Integrity
```bash
npm run seed validate
```

## Development Workflow

### Initial Setup

1. Set up database connection
2. Run migrations: `npm run db:migrate`
3. Run base seed: `npm run seed base`
4. Add demo data: `npm run seed demo`
5. Validate setup: `npm run seed validate`

### Development Cycle

1. Make schema changes
2. Create migration: `npm run db:migrate`
3. Update seed scripts if needed
4. Test with: `npm run seed:validate`
5. Reset if needed: `npm run db:reset`

### Production Deployment

1. Run migrations: `npm run db:migrate:deploy`
2. Run base seed: `npm run seed base`
3. Validate: `npm run seed validate`
4. Monitor: `npm run seed status`

## Best Practices

### Seed Script Development

1. **Idempotent Operations**: Use upsert instead of create
2. **Environment Awareness**: Check NODE_ENV appropriately
3. **Error Handling**: Wrap operations in try-catch
4. **Validation**: Include data validation
5. **Documentation**: Document data relationships

### Data Management

1. **Separate Concerns**: Keep base and demo data separate
2. **Realistic Data**: Use realistic sample data
3. **Relationships**: Maintain proper foreign keys
4. **Cleanup**: Provide cleanup mechanisms
5. **Versioning**: Version seed data changes

### Production Safety

1. **Test First**: Always test in development
2. **Validate**: Run validation before deployment
3. **Backup**: Backup before major changes
4. **Monitor**: Monitor after deployment
5. **Rollback**: Have rollback procedures ready

## API Reference

### SeedManager Class

#### Methods

- `runBaseSeed(options?)` - Execute base seed
- `runDemoSeed(options?)` - Execute demo seed
- `runFullSeed(options?)` - Execute full seed
- `clearDemoData()` - Remove demo data
- `validateSeedData()` - Validate data integrity
- `getCounts()` - Get record counts
- `getStatus()` - Get seeding status
- `isEmpty()` - Check if database is empty
- `hasDemoData()` - Check for demo data

#### Options

```typescript
interface SeedOptions {
  includeDemo?: boolean;  // Include demo data
  force?: boolean;        // Force in production
  verbose?: boolean;      // Verbose output
}
```

#### Results

```typescript
interface SeedResult {
  success: boolean;
  message: string;
  counts?: Record<string, number>;
  error?: string;
}
```

## Contributing

When adding new seed data:

1. Update appropriate seed script (base or demo)
2. Add validation checks
3. Update this documentation
4. Test with validation script
5. Ensure production safety

## Support

For issues with the seeding infrastructure:

1. Check this documentation
2. Run validation: `npm run seed:validate`
3. Check status: `npm run seed status`
4. Review error messages
5. Contact development team