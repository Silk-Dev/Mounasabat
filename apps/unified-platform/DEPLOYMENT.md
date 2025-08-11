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

### 3. Seed Production Data
```bash
npm run db:seed:prod
```

## Deployment Process

### Automated Deployment (Recommended)

Use the deployment script:
```bash
./scripts/production-deploy.sh
```

This script will:
1. Run all tests
2. Build the application
3. Deploy to Vercel
4. Run database migrations
5. Execute smoke tests
6. Create backups

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

4. **Run Database Migrations**
   ```bash
   cd packages/database
   npm run db:migrate:deploy
   npm run db:seed:prod
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