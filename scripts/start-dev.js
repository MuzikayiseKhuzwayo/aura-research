import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Starting Dubstrata local backend and frontend dev servers...');

// Spawn Python FastAPI Server
const pythonProcess = spawn('python', ['scripts/server.py'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

// Spawn Vite frontend dev server
const viteProcess = spawn('npx', ['vite'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

// Handle termination to clean up child processes
const cleanup = () => {
  console.log('\nShutting down dev servers...');
  pythonProcess.kill();
  viteProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
