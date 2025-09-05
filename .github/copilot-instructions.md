# Mounasabet - AI Coding Agent Instructions

## Project Overview

**Mounasabet** is a multi-tenant event planning SaaS platform built with a modern monorepo architecture. The platform connects event organizers with service providers through dynamic booking workflows, real-time communication, and role-based dashboards.

### Architecture
- **Monorepo**: Turborepo with npm workspaces
- **Main App**: Next.js 15 App Router in `apps/unified-platform/`
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: better-auth with role-based access (customer/provider/admin)
- **Frontend**: React 19, shadcn/ui, Tailwind CSS v4, Framer Motion
- **Backend**: Next.js API routes with comprehensive middleware

## Key Development Patterns

### 1. Route Structure & Organization
```
src/app/
├── (customer)/          # Customer-facing routes (public)
├── admin/              # Admin dashboard (role: admin)
├── provider/           # Provider dashboard (role: provider)
├── auth/              # Authentication pages
└── api/               # API routes with role-based access
```

**Critical**: Routes are role-protected via `middleware.ts`. Always check the `protectedRoutes` object when adding new pages.

### 2. Database & State Management
- **No Mock Data**: All components must handle empty states gracefully without fallback mock data
- **Prisma Client**: Import from `@/lib/prisma` - single instance with connection pooling
- **Authentication**: Use `@/lib/auth` for session management
- **Error Handling**: Throw meaningful errors instead of returning empty arrays

### 3. Testing Architecture
```bash
# Unit Tests - Jest + Testing Library
npm run test:unit              # Components and utilities
npm run test:integration       # Full feature flows
npm run test:api              # API route testing

# E2E Tests - Playwright
npm run test:e2e              # Cross-browser testing
npm run test:e2e:ui           # Interactive test runner

# Specialized Tests
npm run test:real-data        # Validates no mock data fallbacks
npm run test:empty-states     # Empty state handling
npm run test:error-scenarios  # Error boundary testing
```

**Critical Testing Pattern**: Components must use `data-testid` attributes for reliable E2E testing. Authentication state is managed via `e2e/fixtures/auth-setup.ts`.

## Development Workflows

### 1. Environment Setup
```bash
# Required commands for new developers
npm install                    # Install all workspace dependencies
npm run db:migrate            # Apply database migrations
npm run db:seed               # Seed with base data
npm run dev                   # Start development servers
```

### 2. Database Operations
```bash
# Development workflow
npm run db:migrate            # Create and apply new migrations
npm run db:seed               # Seed development data
npm run db:studio            # Visual database browser

# Production workflow (handled by deployment scripts)
npm run db:migrate:deploy     # Deploy migrations without prompts
NODE_ENV=production npm run seed base  # Production-safe seeding
```

### 3. Production Deployment
```bash
# Automated deployment via scripts/production-deploy.sh
npm run deploy:production     # Full production deployment pipeline
npm run verify:production     # Post-deployment validation
```

**Critical**: Production uses `deployment.config.js` for environment-specific settings. Demo data is forbidden in production.

## Component Patterns

### 1. Empty State Handling
```tsx
// Always provide proper empty states - NO mock data fallbacks
import { EmptyState } from '@/components/ui/empty-state';

// Bad: Returning mock data when empty
if (results.length === 0) return mockResults;

// Good: Proper empty state component
if (results.length === 0) {
  return (
    <EmptyState
      title="No services found"
      description="Try adjusting your search criteria"
      action={{
        label: "Clear Filters",
        onClick: clearFilters
      }}
    />
  );
}
```

### 2. Error Boundaries & Loading States
```tsx
// Use specialized loading/error components from SearchEmptyStates.tsx
import { SearchLoadingState, SearchErrorState } from '@/components/search/SearchEmptyStates';

if (isLoading) return <SearchLoadingState />;
if (error) return <SearchErrorState error={error} onRetry={handleRetry} />;
```

### 3. Authentication Context
```tsx
// Role-based component rendering
import { useAuth } from '@/lib/auth-context';

const { user, isAuthenticated } = useAuth();
const isProvider = user?.role === 'provider';
const isAdmin = user?.role === 'admin';
```

## Critical Configuration Files

### 1. Middleware Security (`middleware.ts`)
- Implements role-based route protection
- Rate limiting per route type
- CSRF protection for state-changing requests
- Security headers and audit logging

### 2. Turborepo Configuration (`turbo.json`)
- Build dependencies between packages
- Environment variable handling for dev/build tasks
- Caching strategy for monorepo efficiency

### 3. Environment Management
```bash
# Development
.env.local              # Local development variables

# Production
deployment.config.js    # Environment-specific deployment settings
scripts/setup-secrets.sh # Vercel environment variable setup
```

## API Route Conventions

### 1. Route Handler Pattern
```typescript
// All API routes follow this authentication pattern
import { auth } from '@/lib/auth';
import { auditLogger } from '@/lib/audit-logger';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Route logic here
    
  } catch (error) {
    await auditLogger.logError('api_error', error, request);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 2. Database Query Patterns
```typescript
// Always handle database errors explicitly
import { prisma } from '@/lib/prisma';

try {
  const results = await prisma.service.findMany({
    where: { /* conditions */ },
    include: { /* relations */ },
    orderBy: { /* sorting */ }
  });
  
  // Return results directly - no mock data fallbacks
  return Response.json({ results });
} catch (error) {
  // Log and throw - don't return empty arrays silently
  throw new Error(`Database query failed: ${error.message}`);
}
```

## Performance & Monitoring

### 1. Sentry Integration
- Automatic error tracking in production
- Performance monitoring for API routes
- Custom event tracking for user workflows

### 2. Caching Strategy
- Redis for session and search result caching
- Next.js image optimization with proper sizing
- Static generation for public marketing pages

### 3. Security Measures
- Rate limiting per route type (search, API, auth)
- Input validation with Zod schemas
- SQL injection protection via Prisma
- CSRF tokens for state-changing operations

## When Adding New Features

1. **Database Changes**: Create Prisma migration, update seed scripts if needed
2. **New Routes**: Add to `middleware.ts` protection rules if private
3. **Components**: Include `data-testid` attributes for E2E testing
4. **API Routes**: Follow authentication and error handling patterns
5. **Tests**: Write unit tests for components, integration tests for flows
6. **Empty States**: Design proper empty states, never use mock data

## Common Gotchas

- **Mock Data**: Completely forbidden - use proper empty states and error handling
- **Role Protection**: Always verify route access in `middleware.ts` before adding new pages
- **Database Connections**: Use the singleton `prisma` client from `@/lib/prisma`
- **Environment Variables**: Production deployment requires secrets setup via `scripts/setup-secrets.sh`
- **Testing**: E2E tests use pre-seeded database state from `e2e/fixtures/auth-setup.ts`

This platform prioritizes production readiness with comprehensive error handling, security measures, and no fallback mock data. Always handle real-world edge cases explicitly.