import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Runs the safe universal seed script targeting MySQL
const child = spawn(process.execPath, [path.join(__dirname, 'seed.mjs')], {
  stdio: 'inherit',
  env: { ...process.env, DB_ENGINE: 'mysql' },
});

child.on('close', (code) => {
  process.exit(code || 0);
});
