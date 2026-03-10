#!/usr/bin/env node
/**
 * Build all entry points as separate IIFE bundles.
 * Each entry is built independently via `VITE_ENTRY=<name> npx vite build`.
 * Runs sequentially to avoid conflicts with shared output directory.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const entries = [
  'metadata-editor',
  'home',
  'collections',
  'template-manager',
  'templates',
  'tags',
  'schemas',
  'auth',
  'audit-logs',
  'dashboard',
  'compare',
];

const distDir = path.resolve(__dirname, '..', 'vue-app', 'assets', 'dist');

// Clean output directory before building
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log(`Building ${entries.length} entry points as IIFE bundles...\n`);

let failed = 0;
for (const entry of entries) {
  process.stdout.write(`  Building ${entry}...`);
  try {
    execSync(`VITE_ENTRY=${entry} npx vite build`, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
    });
    console.log(' done');
  } catch (err) {
    console.log(' FAILED');
    console.error(err.stderr?.toString() || err.message);
    failed++;
  }
}

console.log(`\nBuild complete: ${entries.length - failed}/${entries.length} succeeded`);
if (failed > 0) {
  process.exit(1);
}
