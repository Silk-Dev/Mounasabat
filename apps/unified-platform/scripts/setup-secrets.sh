#!/bin/bash

# Production Secrets Setup Script
# This script helps set up environment variables in Vercel

set -e

echo "🔐 Setting up production secrets..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Check if .env.local exists for reference
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it with your local environment variables first."
    exit 1
fi

echo "📝 Reading environment variables from .env.local..."

# Function to set Vercel environment variable
set_vercel_env() {
    local key=$1
    local value=$2
    local env_type=${3:-"production"}
    
    if [ -n "$value" ]; then
        echo "Setting $key..."
        echo "$value" | vercel env add "$key" "$env_type" --force
    else
        echo "⚠️  Skipping $key (empty value)"
    fi
}

# Read .env.local and set variables
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^#.*$ ]] || [[ -z $key ]]; then
        continue
    fi
    
    # Remove quotes from value
    value=$(echo "$value" | sed 's/^"//;s/"$//')
    
    # Set the environment variable
    set_vercel_env "$key" "$value"
    
done < .env.local

echo "✅ Production secrets setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Verify secrets in Vercel dashboard"
echo "2. Run 'vercel --prod' to deploy"
echo "3. Test the production deployment"