#!/usr/bin/env node

// Script to run dev server with Gemini API key
// Usage: node dev-with-key.js "your-api-key-here"

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Usage: node dev-with-key.js "your-gemini-api-key"');
  process.exit(1);
}

process.env.GEMINI_API_KEY = apiKey;
console.log('Starting dev server with Gemini API key...');

// Spawn the dev server
const { spawn } = require('child_process');
const child = spawn('npm', ['run', 'dev', '--', '--host'], {
  stdio: 'inherit',
  env: { ...process.env }
});

child.on('exit', (code) => {
  process.exit(code);
});