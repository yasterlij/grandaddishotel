import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, scriptName);
    console.log(`\n▶ Running ${scriptName}...`);
    const child = spawn(process.execPath, [fullPath], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} exited with code ${code}`));
      }
    });

    child.on('error', (err) => reject(err));
  });
}

async function setup() {
  console.log('============================================================');
  console.log('GRAND ADDIS HOTEL - ONE-STEP DATABASE INITIALIZATION & SYNC');
  console.log('============================================================');

  try {
    // 1. Ensure Prisma client contracts are up to date
    await runScript('generate.mjs');

    // 2. Run safe, non-destructive schema migration
    await runScript('migrate.mjs');

    // 3. Seed initial inventory & hotel data (safe, preserves bookings)
    await runScript('seed.mjs');

    // 4. Output database health and row status
    await runScript('db-status.mjs');

    console.log('============================================================');
    console.log('✓ Database setup & contracts completed successfully!');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n✗ Setup encountered an error:', err.message);
    process.exit(1);
  }
}

setup();
