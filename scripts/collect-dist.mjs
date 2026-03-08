import { cpSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(rootDir, 'dist');

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const appsDir = resolve(rootDir, 'apps');
const apps = readdirSync(appsDir);
for (const app of apps) {
  const sourceDir = resolve(appsDir, app, 'dist');
  const targetDir = resolve(outputDir, app);
  try {
    cpSync(sourceDir, targetDir, { recursive: true });
    console.log(`Collected: apps/${app}/dist -> dist/${app}/`);
  } catch (err) {
    console.warn(`Warning: Could not copy apps/${app}/dist (may not exist yet)`);
  }
}

console.log('Build artifacts collected to dist/');
