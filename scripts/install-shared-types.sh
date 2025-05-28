#!/bin/bash

# Install shared types script
# This script installs the shared types package to both frontend and backend

echo "🔧 Installing shared types..."

# Build shared types
echo "📦 Building shared types..."
cd shared/types
npm run build
cd ../..

# Install to frontend
echo "⚛️ Installing to frontend..."
rm -rf node_modules/@spring-book-club
mkdir -p node_modules/@spring-book-club
cp -r shared/types node_modules/@spring-book-club/shared-types

# Install to backend
echo "🔙 Installing to backend..."
rm -rf apps/backend/node_modules/@spring-book-club
mkdir -p apps/backend/node_modules/@spring-book-club
cp -r shared/types apps/backend/node_modules/@spring-book-club/shared-types

echo "✅ Shared types installed successfully!"
echo ""
echo "📝 Note: Run this script whenever you update shared types:"
echo "   ./scripts/install-shared-types.sh"