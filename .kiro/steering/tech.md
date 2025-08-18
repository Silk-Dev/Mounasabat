# Technology Stack

## Build System & Architecture

- **Monorepo**: Turborepo for workspace management
- **Package Manager**: npm with workspaces
- **Language**: TypeScript across all packages
- **Node.js**: v18+ required

## Frontend Stack

- **Framework**: Next.js 15 with App Router
- **React**: v19 with React Server Components
- **Styling**: Tailwind CSS v4 with JIT compilation
- **UI Components**: shadcn/ui with Radix UI primitives
- **Animations**: Framer Motion
- **Icons**: Lucide React, React Icons
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Context + hooks pattern

## Backend & Database

- **API**: Next.js API Routes (App Router)
- **Database**: PostgreSQL with Prisma ORM v5.8.0
- **Authentication**: better-auth
- **Caching**: Redis with ioredis client
- **Payment**: Stripe integration
- **Real-time**: Socket.io for live features

## Development Tools

- **Testing**: Jest + React Testing Library, Playwright for E2E
- **Linting**: ESLint with custom config
- **Type Checking**: TypeScript strict mode
- **Performance**: Sentry monitoring, bundle analysis
- **CI/CD**: GitHub Actions

## Common Commands

```bash
# Development
npm run dev              # Start all apps in development
npm run build           # Build all packages and apps
npm run lint            # Lint all workspaces
npm run test            # Run all tests

# Database
npm run db:migrate      # Run Prisma migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio

# Specific apps
npm run dev --filter=unified-platform    # Dev specific app
npm run build --filter=@mounasabet/ui    # Build specific package

# Testing
npm run test:unit       # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:api        # API tests
npm run test:performance # Performance tests
```

## Environment Setup

1. Install Node.js v18+
2. Run `npm install` from root
3. Copy `.env.example` to `.env`
4. Start PostgreSQL and Redis (via Docker Compose)
5. Run `npm run db:migrate` and `npm run db:seed`
6. Start development with `npm run dev`