#!/usr/bin/env node

// Script to run the dev server with a one-off Gemini API key.
// Usage: node dev-with-key.js "your-api-key-here"

import { spawn } from 'node:child_process';

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Usage: node dev-with-key.js "your-gemini-api-key"');
  process.exit(1);
}

console.log('Starting dev server with Gemini API key...');
const child = spawn('npm', ['run', 'dev', '--', '--host'], {
  stdio: 'inherit',
  env: { ...process.env, GEMINI_API_KEY: apiKey },
  shell: process.platform === 'win32',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});