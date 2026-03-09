import { cpSync, mkdirSync, readdirSync, rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(rootDir, 'dist');

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// Collect app builds
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

// Copy root files (portal + config)
const rootFiles = ['index.html', 'CNAME'];
for (const file of rootFiles) {
  const sourceFile = resolve(rootDir, file);
  if (existsSync(sourceFile)) {
    const targetFile = resolve(outputDir, file);
    try {
      cpSync(sourceFile, targetFile);
      console.log(`Copied: ${file} -> dist/${file}`);
    } catch (err) {
      console.warn(`Warning: Could not copy ${file}`);
    }
  }
}

// Copy assets folder (screenshots and other static assets)
const assetsDir = resolve(rootDir, 'assets');
if (existsSync(assetsDir)) {
  const targetAssetsDir = resolve(outputDir, 'assets');
  try {
    cpSync(assetsDir, targetAssetsDir, { recursive: true });
    console.log(`Copied: assets/ -> dist/assets/`);
  } catch (err) {
    console.warn(`Warning: Could not copy assets folder`);
  }
}

console.log('✓ Build artifacts collected to dist/');
