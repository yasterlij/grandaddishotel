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
npm install --legacy-peer-deps --include=dev

# 2. Generate Prisma client contracts
echo "▶ Step 2: Generating Prisma client contracts..."
node scripts/generate.mjs

# 3. Run database migrations (safe & non-destructive)
echo "▶ Step 3: Running database migrations..."
node scripts/migrate.mjs

# 4. Seed default hotel data & inventory (preserves existing bookings)
echo "▶ Step 4: Ensuring default data is seeded..."
node scripts/seed.mjs

# 5. Verify database health and connectivity
echo "▶ Step 5: Checking database health & row counts..."
node scripts/db-status.mjs || true

# 6. Build the optimized Next.js production bundle
if [ -f ".next/BUILD_ID" ]; then
  echo "▶ Step 6: Pre-compiled production build detected (.next/BUILD_ID exists). Skipping build to bypass server RAM limits!"
else
  echo "▶ Step 6: Compiling Next.js application bundle..."
  npx next build --webpack
fi

# 7. Trigger application process restart for Plesk & cPanel (LiteSpeed / Passenger)
echo "▶ Step 7: Triggering application process restart..."
mkdir -p tmp
touch tmp/restart.txt
# If running under cPanel/LiteSpeed external app, kill stale worker so LiteSpeed immediately spawns fresh process
pkill -u "$(whoami)" -f "node.*(app|server)\.js" 2>/dev/null || true

echo "--------------------------------------------------------"
echo "✓ Grand Addis Hotel deployment finished successfully!"
echo "--------------------------------------------------------"
