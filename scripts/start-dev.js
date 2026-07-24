import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Starting Dubstrata local backend and frontend dev servers...');

// Clean up any orphaned processes on port 8000 to avoid winerror 10048
try {
  const output = execSync('netstat -ano | findstr :8000').toString();
  const lines = output.trim().split('\n');
  for (const line of lines) {
    if (line.includes('LISTENING')) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        console.log(`Port 8000 is in use. Killing process with PID ${pid}...`);
        execSync(`taskkill /F /PID ${pid}`);
      }
    }
  }
} catch (e) {
  // netstat returns non-zero code if no matches found (which means port is free)
}

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
