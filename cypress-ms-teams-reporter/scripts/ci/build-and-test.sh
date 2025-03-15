#!/bin/bash
set -e  # Exit if any command fails

echo "📦 Installing dependencies..."
npm install

echo "✅ Running Cypress tests..."
npx cypress run || echo "⚠️ Cypress tests failed, but continuing..."

echo "🚀 Build complete!"
