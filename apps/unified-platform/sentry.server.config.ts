import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture 100% of the transactions for performance monitoring in development
  // Reduce this value in production
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  beforeSend(event, hint) {
    // Filter out sensitive information
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    
    // Filter out database connection errors in development
    if (process.env.NODE_ENV === 'development') {
      const error = hint.originalException;
      if (error instanceof Error && error.message.includes('connect ECONNREFUSED')) {
        return null;
      }
    }
    
    return event;
  },
  
  integrations: [
    new Sentry.Integrations.Prisma({ client: undefined }),
  ],
});