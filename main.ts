// VICE TIDE Cover Studio — hand-in program for make.fun's "Make GTA 6 Cover Art".
// Copies app/ and screenshots/ into the output directory and writes dossier.json
// with buildDossier from the kit's vendor/makefun-app.ts.
// It never deletes the output directory itself: the grader runs as a user who
// cannot remove that directory, so removing it fails the run. It only creates
// the directory (mkdir, recursive) and copies files into it.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { buildDossier } from './vendor/makefun-app.ts';

const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const appDir = 'app';
const shotsDir = 'screenshots';

if (!existsSync(appDir)) throw new Error('missing app/ in the repository');
if (!existsSync(shotsDir)) throw new Error('missing screenshots/ in the repository');

// The gate wants 3 or 4 screenshots; refuse early instead of handing in a bad set.
import { readdirSync } from 'node:fs';
const shotFiles = readdirSync(shotsDir).filter((f) => !f.startsWith('.'));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error('screenshots/ must hold 3 or 4 images, found ' + shotFiles.length);
}

mkdirSync(outDir, { recursive: true });
cpSync(appDir, outDir + '/app', { recursive: true });
cpSync(shotsDir, outDir + '/screenshots', { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(outDir + '/dossier.json', dossier);
console.log('VICE TIDE handed in to ' + outDir);
