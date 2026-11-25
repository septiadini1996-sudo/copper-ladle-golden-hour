// The Copper Ladle: Golden Hour — hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ (game/index.html plus its ES modules; it plays
// offline in a desktop browser and loads nothing over the network). This program hands the
// entry in: it copies game/ and screenshots/ from beside this file into the output directory
// and writes dossier.json there with the vendored make.fun library, exactly the bytes the
// gate rebuilds and compares.
//
// In the grader the output directory is /output; anywhere else MAKEFUN_OUTPUT_DIR names it:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The gate's caps, passed to the dossier builder so an over-cap entry fails here first:
// dossier text is capped at 160 KiB, at most 4 screenshots of 256 KiB each, and game/ holds
// at most 993 files, 48 MiB in all, with no path over 1,000 bytes.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
