#!/bin/bash

# Agent Lab Complete Deployment Setup Script
# This script helps you set up the entire Agent Lab deployment

set -e

echo "🚀 Agent Lab Deployment Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install pnpm first."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL is not set. Please set it to your Neon PostgreSQL connection string:"
        echo "export DATABASE_URL='postgresql://username:password@hostname:port/database?sslmode=require'"
        echo ""
        read -p "Enter your Neon DATABASE_URL: " DATABASE_URL
        export DATABASE_URL
    fi
    
    if [ -z "$NEXT_PUBLIC_API_BASE" ]; then
        print_warning "NEXT_PUBLIC_API_BASE is not set. This should be your Railway app URL."
        echo "Example: https://agent-lab-production.up.railway.app"
        echo ""
        read -p "Enter your Railway API URL: " NEXT_PUBLIC_API_BASE
        export NEXT_PUBLIC_API_BASE
    fi
    
    print_success "Environment variables configured"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    pnpm install
    print_success "Dependencies installed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL is not set. Cannot setup database."
        exit 1
    fi
    
    print_status "Running database migration..."
    pnpm drizzle-kit migrate
    
    print_success "Database setup complete"
}

# Build the application
build_application() {
    print_status "Building application..."
    
    # Build backend
    print_status "Building backend..."
    pnpm build
    
    # Build frontend
    print_status "Building frontend..."
    pnpm build:ui
    
    print_success "Application built successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    pnpm test
    print_success "All tests passed"
}

# Create deployment files
create_deployment_files() {
    print_status "Creating deployment configuration files..."
    
    # Create .env file for local development
    cat > .env << EOF
# Agent Lab Environment Configuration
DATABASE_URL="$DATABASE_URL"
NEXT_PUBLIC_API_BASE="$NEXT_PUBLIC_API_BASE"
NODE_ENV="development"
LOG_LEVEL="info"
PORT=3000
EOF
    
    # Create .env.local for frontend
    cat > apps/ui/.env.local << EOF
NEXT_PUBLIC_API_BASE="$NEXT_PUBLIC_API_BASE"
EOF
    
    print_success "Deployment files created"
}

# Test the setup
test_setup() {
    print_status "Testing the setup..."
    
    # Test database connection
    print_status "Testing database connection..."
    if pnpm drizzle-kit studio --port 3001 &> /dev/null; then
        print_success "Database connection successful"
    else
        print_warning "Database connection test failed, but this might be normal in CI"
    fi
    
    # Test API health endpoint (if Railway is deployed)
    if [ ! -z "$NEXT_PUBLIC_API_BASE" ]; then
        print_status "Testing API health endpoint..."
        if curl -s "$NEXT_PUBLIC_API_BASE/health" | grep -q "ok"; then
            print_success "API health check passed"
        else
            print_warning "API health check failed - make sure Railway is deployed"
        fi
    fi
}

# Main setup function
main() {
    echo ""
    print_status "Starting Agent Lab deployment setup..."
    echo ""
    
    check_dependencies
    setup_environment
    install_dependencies
    setup_database
    build_application
    run_tests
    create_deployment_files
    test_setup
    
    echo ""
    print_success "🎉 Agent Lab setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to Railway: Connect your GitHub repo to Railway"
    echo "2. Deploy to Vercel: Connect your GitHub repo to Vercel"
    echo "3. Set environment variables in Railway and Vercel dashboards"
    echo "4. Test the complete workflow"
    echo ""
    echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"
    echo ""
}

# Run main function
main "$@"
