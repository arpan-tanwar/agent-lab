#!/bin/bash

# Agent Lab Database Migration Script
# This script runs the database migrations for the Agent Lab application

echo "🚀 Starting Agent Lab database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your DATABASE_URL before running this script"
    exit 1
fi

echo "📊 Running database migrations..."

# Run the migration
pnpm drizzle-kit migrate

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
    echo "🎉 Your Agent Lab database is now ready to use"
else
    echo "❌ Database migration failed"
    echo "Please check the error messages above and try again"
    exit 1
fi
