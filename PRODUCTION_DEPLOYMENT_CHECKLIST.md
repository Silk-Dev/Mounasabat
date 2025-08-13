# Production Deployment Checklist

This checklist ensures that production deployments follow the correct procedures and only use base seed data.

## Pre-Deployment Checklist

### Environment Configuration
- [ ] `NODE_ENV=production` is set
- [ ] All required environment variables are configured
- [ ] Database connection string is correct for production
- [ ] Redis connection is configured
- [ ] Stripe keys are production keys (not test keys)
- [ ] Monitoring services are configured (Sentry, etc.)

### Code Quality
- [ ] All tests pass (`npm run test`)
- [ ] Integration tests pass (`npm run test:integration`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] No mock data detection tests fail
- [ ] Code is linted and formatted
- [ ] TypeScript compilation succeeds

### Database Preparation
- [ ] Database migrations are ready (`npm run db:migrate:deploy`)
- [ ] Production setup script is ready (`npm run db:setup:prod`)
- [ ] Base seed script is validated (`npm run seed validate`)
- [ ] Demo seed is NOT included in production deployment
- [ ] Database backup is created (if applicable)

## Deployment Process

### Automated Deployment (Recommended)
```bash
# Use the deployment pipeline
npm run deploy:production
```

### Manual Deployment Steps
1. **Run Pre-deployment Checks**
   ```bash
   npm run test
   npm run test:integration
   npm run test:e2e
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Deploy to Platform**
   ```bash
   # For Vercel
   vercel --prod
   ```

4. **Run Database Migrations**
   ```bash
   cd packages/database
   npm run db:migrate:deploy
   npm run db:setup:prod
   ```

5. **Seed Production Database (Base Only)**
   ```bash
   NODE_ENV=production npm run seed base
   npm run seed validate
   ```

6. **Verify Deployment**
   ```bash
   npm run test:smoke
   npm run monitoring:check
   ```

## Post-Deployment Verification

### Health Checks
- [ ] Application is accessible at production URL
- [ ] Health endpoint returns 200 (`/api/health`)
- [ ] Database connectivity is working
- [ ] Authentication system is functional
- [ ] Payment processing is working (test transaction)

### Data Verification
- [ ] Only base seed data is present (no demo data)
- [ ] Essential categories are available
- [ ] Platform settings are configured
- [ ] Admin users are created
- [ ] Email templates are available
- [ ] No empty states that would break functionality

### Monitoring Setup
- [ ] Error tracking is active (Sentry)
- [ ] Performance monitoring is enabled
- [ ] Database monitoring is running
- [ ] Alert notifications are configured
- [ ] Log aggregation is working

### Security Verification
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] Rate limiting is active
- [ ] Input validation is working
- [ ] Authentication is secure
- [ ] API endpoints are protected

## Environment-Specific Seed Configuration

### Production Environment
- **Allowed Seeds**: `base` only
- **Demo Data**: ❌ NOT ALLOWED
- **Validation**: ✅ Required after seeding
- **Backup**: ✅ Required before seeding

### Staging Environment
- **Allowed Seeds**: `base`, `demo`
- **Demo Data**: ✅ Allowed for testing
- **Validation**: ✅ Required after seeding
- **Backup**: ✅ Recommended

### Development Environment
- **Allowed Seeds**: `base`, `demo`, `test`
- **Demo Data**: ✅ Allowed
- **Validation**: ✅ Recommended
- **Backup**: ⚠️  Optional

## Monitoring and Alerting

### Automated Monitoring
The system automatically monitors for:
- Empty states that affect user experience
- Missing essential data
- Database connectivity issues
- Data integrity problems

### Alert Conditions
Alerts are triggered when:
- No admin users exist
- No active categories are available
- No verified providers exist
- Database connectivity fails
- Critical platform settings are missing

### Monitoring Commands
```bash
# Check current database status
npm run monitoring:check

# Get detailed monitoring report
curl https://your-domain.com/api/monitoring?action=report

# Run health check
curl https://your-domain.com/api/monitoring?action=health
```

## Rollback Procedures

### Automatic Rollback
The deployment script automatically rolls back if:
- Tests fail during deployment
- Database migrations fail
- Smoke tests fail after deployment

### Manual Rollback
```bash
# Using deployment script
./scripts/production-deploy.sh rollback

# Using Vercel CLI
vercel rollback

# Using deployment pipeline
npm run deploy:production -- rollback
```

## Troubleshooting

### Common Issues

1. **Seed Script Fails**
   - Check database connectivity
   - Verify environment variables
   - Check for existing data conflicts
   - Review migration status

2. **Empty States Detected**
   - Run base seed script: `NODE_ENV=production npm run seed base`
   - Validate seed data: `npm run seed validate`
   - Check monitoring report: `npm run monitoring:check`

3. **Demo Data in Production**
   - This should never happen with proper deployment
   - If detected, clear demo data: `npm run seed clear-demo`
   - Re-run base seed: `NODE_ENV=production npm run seed base`

4. **Monitoring Alerts**
   - Check monitoring dashboard: `/api/monitoring?action=metrics`
   - Review alert details in database
   - Address underlying issues before resolving alerts

### Debug Commands
```bash
# Check deployment configuration
node -e "console.log(require('./deployment.config.js').getConfig('production'))"

# Validate seed configuration
npm run seed status

# Check database counts
npm run seed counts

# Test monitoring system
npm run monitoring:check
```

## Security Considerations

### Data Protection
- [ ] No sensitive data in logs
- [ ] Database credentials are secure
- [ ] API keys are production keys
- [ ] Encryption keys are properly configured

### Access Control
- [ ] Admin access is restricted
- [ ] API endpoints have proper authentication
- [ ] Rate limiting is configured
- [ ] CORS is properly configured

### Monitoring Security
- [ ] Monitoring endpoints are protected
- [ ] Alert webhooks are secure
- [ ] Log data is encrypted in transit
- [ ] Access logs are maintained

## Performance Optimization

### Database Performance
- [ ] Indexes are created for production queries
- [ ] Query performance is optimized
- [ ] Connection pooling is configured
- [ ] Materialized views are refreshed

### Application Performance
- [ ] Static assets are cached
- [ ] API responses are cached appropriately
- [ ] Images are optimized
- [ ] Code splitting is implemented

### Monitoring Performance
- [ ] Monitoring queries are optimized
- [ ] Alert frequency is reasonable
- [ ] Log retention is configured
- [ ] Performance metrics are tracked

## Compliance and Documentation

### Documentation Updates
- [ ] Deployment documentation is current
- [ ] API documentation is updated
- [ ] Environment variables are documented
- [ ] Monitoring procedures are documented

### Compliance Checks
- [ ] Data retention policies are implemented
- [ ] Privacy policies are updated
- [ ] Security policies are followed
- [ ] Audit logs are maintained

## Sign-off

### Technical Review
- [ ] Code review completed
- [ ] Security review completed
- [ ] Performance review completed
- [ ] Documentation review completed

### Business Review
- [ ] Feature requirements met
- [ ] User acceptance criteria satisfied
- [ ] Business stakeholder approval
- [ ] Go-live approval obtained

### Final Checklist
- [ ] All pre-deployment checks passed
- [ ] Deployment completed successfully
- [ ] Post-deployment verification completed
- [ ] Monitoring is active and healthy
- [ ] Team is notified of successful deployment

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Reviewed By**: _______________
**Approved By**: _______________