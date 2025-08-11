#!/bin/bash

# Production Deployment Script
# This script handles the complete production deployment process

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="apps/unified-platform"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        print_error "Not in the correct project directory"
        exit 1
    fi
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Please install it first:"
        echo "npm install -g vercel"
        exit 1
    fi
    
    # Check if we're logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_error "Not logged in to Vercel. Please run 'vercel login'"
        exit 1
    fi
    
    # Check if environment variables are set
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL not set. Make sure to configure it in Vercel"
    fi
    
    print_status "Prerequisites check completed"
}

# Run tests before deployment
run_tests() {
    print_status "Running tests..."
    
    cd "$PROJECT_DIR"
    
    # Install dependencies
    npm ci
    
    # Run unit tests
    print_status "Running unit tests..."
    npm run test -- --run
    
    # Run integration tests
    print_status "Running integration tests..."
    npm run test:integration -- --run
    
    # Run E2E tests
    print_status "Running E2E tests..."
    npm run test:e2e
    
    print_status "All tests passed"
    cd ..
}

# Build the application
build_application() {
    print_status "Building application..."
    
    cd "$PROJECT_DIR"
    
    # Use production Next.js config
    cp next.config.prod.js next.config.js
    
    # Build the application
    npm run build
    
    print_status "Application built successfully"
    cd ..
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    cd "$PROJECT_DIR"
    
    # Deploy to production
    vercel --prod --yes
    
    print_status "Deployment completed"
    cd ..
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    cd "packages/database"
    
    # Run production migrations
    npm run db:migrate:deploy
    
    # Run production setup
    npm run db:setup:prod
    
    # Seed production data
    npm run db:seed:prod
    
    print_status "Database migrations completed"
    cd ../..
}

# Run smoke tests
run_smoke_tests() {
    print_status "Running smoke tests..."
    
    cd "$PROJECT_DIR"
    
    # Wait for deployment to be ready
    sleep 30
    
    # Run smoke tests
    npm run test:smoke
    
    print_status "Smoke tests passed"
    cd ..
}

# Create backup
create_backup() {
    print_status "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database (if applicable)
    if [ -n "$DATABASE_URL" ]; then
        print_status "Creating database backup..."
        # Add database backup logic here
    fi
    
    # Backup configuration files
    cp -r "$PROJECT_DIR/.env.production" "$BACKUP_DIR/" 2>/dev/null || true
    cp -r "$PROJECT_DIR/vercel.json" "$BACKUP_DIR/" 2>/dev/null || true
    
    print_status "Backup created at $BACKUP_DIR"
}

# Rollback function
rollback() {
    print_error "Deployment failed. Rolling back..."
    
    cd "$PROJECT_DIR"
    
    # Get previous deployment
    PREVIOUS_DEPLOYMENT=$(vercel ls --meta production | head -2 | tail -1 | awk '{print $1}')
    
    if [ -n "$PREVIOUS_DEPLOYMENT" ]; then
        print_status "Rolling back to $PREVIOUS_DEPLOYMENT"
        vercel promote "$PREVIOUS_DEPLOYMENT"
    else
        print_error "No previous deployment found for rollback"
    fi
    
    cd ..
}

# Main deployment process
main() {
    print_status "Starting production deployment process..."
    
    # Trap errors and rollback
    trap rollback ERR
    
    # Create backup first
    create_backup
    
    # Check prerequisites
    check_prerequisites
    
    # Run tests
    run_tests
    
    # Build application
    build_application
    
    # Deploy to Vercel
    deploy_to_vercel
    
    # Run database migrations
    run_migrations
    
    # Run smoke tests
    run_smoke_tests
    
    print_status "🎉 Production deployment completed successfully!"
    
    # Print deployment info
    cd "$PROJECT_DIR"
    DEPLOYMENT_URL=$(vercel ls --meta production | head -2 | tail -1 | awk '{print $2}')
    print_status "Deployment URL: $DEPLOYMENT_URL"
    cd ..
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "test")
        run_tests
        ;;
    "smoke")
        run_smoke_tests
        ;;
    *)
        echo "Usage: $0 [deploy|rollback|test|smoke]"
        echo "  deploy  - Full production deployment (default)"
        echo "  rollback - Rollback to previous deployment"
        echo "  test    - Run tests only"
        echo "  smoke   - Run smoke tests only"
        exit 1
        ;;
esac