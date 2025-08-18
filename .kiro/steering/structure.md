# Project Structure

## Monorepo Organization

The project follows a Turborepo monorepo structure with clear separation between applications and shared packages.

```
mounasabet/
├── apps/                    # Applications
│   ├── unified-platform/    # Main platform (Next.js 15)
│   ├── client/             # Customer-facing app
│   ├── admin/              # Admin dashboard
│   └── marketing/          # Marketing site
├── packages/               # Shared packages
│   ├── ui/                 # shadcn/ui component library
│   ├── database/           # Prisma client & schemas
│   ├── types/              # Shared TypeScript types
│   ├── events/             # Event management logic
│   ├── pricing/            # Pricing calculations
│   ├── notifications/      # Notification system
│   ├── calendar/           # Calendar integrations
│   ├── users/              # User management
│   ├── utils/              # Shared utilities
│   ├── eslint-config/      # ESLint configuration
│   └── tsconfig/           # TypeScript configurations
└── docker-compose.yml      # Local development services
```

## App Structure (Next.js 15 App Router)

```
apps/unified-platform/src/
├── app/                    # App Router pages
│   ├── (customer)/         # Customer route group
│   ├── admin/              # Admin pages
│   ├── auth/               # Authentication pages
│   ├── api/                # API routes
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── ui/                 # Base UI components
│   ├── booking/            # Booking-specific components
│   ├── admin/              # Admin components
│   └── providers/          # Context providers
├── lib/                    # Utility libraries
│   ├── auth.ts             # Authentication logic
│   ├── prisma.ts           # Database client
│   ├── validation.ts       # Zod schemas
│   └── utils.ts            # Helper functions
├── hooks/                  # Custom React hooks
└── types/                  # App-specific types
```

## Package Structure

```
packages/ui/src/
├── components/ui/          # shadcn/ui components
├── hooks/                  # Shared hooks
├── lib/                    # Utilities (cn, etc.)
└── styles/                 # Global CSS

packages/database/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Database seeding
└── src/
    ├── auth.ts             # Auth configuration
    └── prisma.ts           # Client setup
```

## Naming Conventions

- **Files**: kebab-case for components, camelCase for utilities
- **Components**: PascalCase React components
- **Packages**: Scoped with `@mounasabet/` prefix
- **API Routes**: RESTful naming in `app/api/`
- **Database**: snake_case for tables, camelCase for Prisma models

## Import Patterns

```typescript
// Internal packages
import { Button } from '@mounasabet/ui'
import { prisma } from '@mounasabet/database'

// Relative imports for same app
import { BookingForm } from '../components/booking/BookingForm'
import { validateBooking } from '../lib/validation'

// Absolute imports from src
import { auth } from '@/lib/auth'
import type { User } from '@/types'
```

## Configuration Files

- `turbo.json`: Turborepo task configuration
- `package.json`: Workspace and script definitions
- `tsconfig.json`: TypeScript configuration per package
- `tailwind.config.ts`: Tailwind CSS configuration
- `next.config.js`: Next.js configuration with transpilation
- `prisma/schema.prisma`: Database schema and models