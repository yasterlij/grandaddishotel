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
  console.log('GRAND ADDIS HOTEL - ONE-STEP DATABASE INITIALIZATION');
  console.log('============================================================');

  try {
    // 1. Run safe schema migration
    await runScript('migrate-mysql.mjs');

    // 2. Seed initial inventory & hotel data
    await runScript('seed-mysql.mjs');

    // 3. Output database status
    await runScript('db-status.mjs');

    console.log('============================================================');
    console.log('✓ Database setup completed successfully!');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n✗ Setup encountered an error:', err.message);
    process.exit(1);
  }
}

setup();
