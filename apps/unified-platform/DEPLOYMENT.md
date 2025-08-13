# Production Deployment Guide

This guide covers the complete production deployment process for the Unified Booking Platform.

## Prerequisites

### Required Tools
- Node.js 18+ 
- npm or yarn
- Vercel CLI (`npm install -g vercel`)
- PostgreSQL client (for database operations)
- k6 (for load testing) - optional

### Required Accounts
- Vercel account for hosting
- PostgreSQL database (Supabase, Neon, or similar)
- Stripe account for payments
- Sentry account for monitoring
- Redis instance (Upstash recommended)

## Environment Setup

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd mounasabet
npm install
```

### 2. Configure Environment Variables

Copy the production environment template:
```bash
cp apps/unified-platform/.env.production apps/unified-platform/.env.local
```

Fill in all required environment variables:

#### Database
```env
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database
```

#### Authentication
```env
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://your-domain.com
```

#### Payment Processing
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Monitoring
```env
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

#### Other Services
```env
RESEND_API_KEY=re_...
REDIS_URL=redis://...
GOOGLE_MAPS_API_KEY=AIza...
```

### 3. Set Up Vercel Project

```bash
cd apps/unified-platform
vercel login
vercel link
```

### 4. Configure Vercel Environment Variables

Use the setup script:
```bash
./scripts/setup-secrets.sh
```

Or manually set them in the Vercel dashboard.

## Database Setup

### 1. Run Migrations
```bash
cd packages/database
npm run db:migrate:deploy
```

### 2. Set Up Production Optimizations
```bash
npm run db:setup:prod
```

### 3. Seed Production Data (Base Only)
```bash
# Only run base seed in production
NODE_ENV=production npm run seed base

# Validate seed data
npm run seed validate
```

**Important**: Production deployments must NEVER include demo data. Only the base seed script should be run to ensure essential platform data is available without any test or demo content.

## Deployment Process

### Automated Deployment (Recommended)

Use the deployment pipeline:
```bash
npm run deploy:production
```

Or use the legacy deployment script:
```bash
./scripts/production-deploy.sh
```

The deployment pipeline will:
1. Check prerequisites and environment configuration
2. Install dependencies
3. Run all tests (unit, integration, E2E)
4. Build the application with production configuration
5. Run database migrations and production setup
6. Seed database with base data only (no demo data)
7. Validate seed data integrity
8. Deploy to Vercel
9. Run post-deployment smoke tests
10. Set up monitoring and alerting
11. Create deployment backups

### Manual Deployment

1. **Run Tests**
   ```bash
   npm run test
   npm run test:e2e
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Run Database Migrations and Seeding**
   ```bash
   cd packages/database
   npm run db:migrate:deploy
   npm run db:setup:prod
   
   # Seed with base data only (NEVER demo data in production)
   NODE_ENV=production npm run seed base
   npm run seed validate
   ```

5. **Verify Deployment**
   ```bash
   npm run test:smoke
   ```

## Post-Deployment Verification

### 1. Health Check
Visit `https://your-domain.com/api/health` to verify the application is running.

### 2. Smoke Tests
```bash
npm run test:smoke
```

### 3. Load Testing
```bash
npm run test:load
```

## Monitoring and Alerting

### Database Monitoring
- Automated monitoring for empty states and missing data
- Real-time alerts for critical data issues
- Performance monitoring for database queries
- Data integrity checks

### Monitoring Endpoints
- `/api/monitoring?action=health` - Basic health check
- `/api/monitoring?action=metrics` - Comprehensive metrics
- `/api/monitoring?action=check` - Run monitoring check
- `/api/monitoring?action=report` - Generate monitoring report

### Automated Monitoring Checks
The system automatically monitors for:
- Missing admin users
- Empty service categories
- No verified providers
- Missing platform settings
- Database connectivity issues
- Data integrity problems

### Alert Configuration
Alerts are sent when:
- Critical empty states are detected
- Essential data is missing
- Database errors occur
- Performance thresholds are exceeded

### Monitoring Commands
```bash
# Run monitoring check
npm run monitoring:check

# Set up monitoring cron job (runs every 15 minutes)
*/15 * * * * /path/to/project/scripts/monitoring-cron.js

# Check monitoring status via API
curl https://your-domain.com/api/monitoring?action=health
```

### Sentry Integration
- Error tracking and performance monitoring
- Automatic error alerts
- Release tracking

### Health Monitoring
- `/api/health` endpoint for load balancer health checks
- Database connectivity monitoring
- External service health checks

### Custom Alerts
- Slack webhook integration
- Database alert storage
- Performance threshold monitoring
- Environment-specific alert configuration

## Performance Optimization

### Caching Strategy
- Static assets cached for 1 year
- API responses cached appropriately
- Database query optimization with indexes
- Redis caching for frequently accessed data

### Image Optimization
- Next.js Image component with AVIF/WebP support
- Responsive image sizes
- Lazy loading implementation

### Code Splitting
- Route-based code splitting
- Component-based lazy loading
- Feature-based module splitting

## Security Measures

### Headers
- Security headers configured in `next.config.prod.js`
- CSRF protection
- Content Security Policy

### Authentication
- Better-auth integration with role-based access
- Session management
- Password hashing with bcrypt

### Data Protection
- Input validation and sanitization
- Rate limiting on API endpoints
- Encryption for sensitive data

## Backup and Recovery

### Database Backups
- Automated daily backups (configure with your database provider)
- Point-in-time recovery capability
- Backup verification procedures

### Application Backups
- Configuration files backed up before deployment
- Previous deployment versions maintained in Vercel
- Rollback procedures documented

## Rollback Procedures

### Automatic Rollback
If deployment fails, the script will automatically rollback to the previous version.

### Manual Rollback
```bash
./scripts/production-deploy.sh rollback
```

Or using Vercel CLI:
```bash
vercel rollback
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check database server status
   - Verify network connectivity

2. **Build Failures**
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Check for missing environment variables

3. **Performance Issues**
   - Monitor Sentry performance metrics
   - Check database query performance
   - Verify caching is working correctly

### Debug Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Check database connection
npm run db:studio

# Run health check
curl https://your-domain.com/api/health
```

## Maintenance

### Regular Tasks
- Monitor error rates in Sentry
- Review performance metrics
- Update dependencies monthly
- Review and rotate secrets quarterly

### Scaling Considerations
- Monitor database performance
- Consider read replicas for high traffic
- Implement CDN for static assets
- Consider horizontal scaling with multiple regions

## Support

For deployment issues:
1. Check the deployment logs in Vercel
2. Review Sentry error reports
3. Run smoke tests to identify specific failures
4. Check database connectivity and migrations

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] Database credentials are secure
- [ ] API keys are production keys (not test keys)
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented
- [ ] HTTPS is enforced
- [ ] Monitoring is active

## Performance Checklist

- [ ] Images are optimized
- [ ] Caching is configured
- [ ] Database indexes are created
- [ ] Code splitting is implemented
- [ ] Bundle size is optimized
- [ ] Load testing is completed
- [ ] Performance monitoring is active