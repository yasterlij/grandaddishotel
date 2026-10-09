#!/usr/bin/env bash
# =============================================================================
# Grand Addis Hotel - Automated Plesk Deployment Script
# Place this in Plesk > Git > Additional deployment actions OR run via SSH.
# =============================================================================

set -e

echo "--------------------------------------------------------"
echo "  Deploying Grand Addis Hotel to Plesk Server"
echo "  Date: $(date)"
echo "--------------------------------------------------------"

# 1. Install production & build dependencies
echo "▶ Step 1: Installing dependencies..."
npm install --legacy-peer-deps

# 2. Build the optimized Next.js production bundle
echo "▶ Step 2: Compiling Next.js application bundle..."
npx next build --webpack

# 3. Create tmp directory and trigger Phusion Passenger reload
echo "▶ Step 3: Triggering application process restart..."
mkdir -p tmp
touch tmp/restart.txt

echo "--------------------------------------------------------"
echo "✓ Grand Addis Hotel deployment finished successfully!"
echo "--------------------------------------------------------"
