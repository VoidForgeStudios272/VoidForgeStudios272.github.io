import { readFile, writeFile, rm } from 'node:fs/promises';

const root = 'among-us/engine/frontend';
const upstream = 'https://raw.githubusercontent.com/arizkhalid/among-us-clone/main/frontend/public/';

async function replace(path, pairs) {
  const file = `${root}/${path}`;
  let text = await readFile(file, 'utf8');
  for (const [before, after] of pairs) {
    if (!text.includes(before)) {
      if (text.includes(after)) continue;
      throw new Error(`Expected source marker not found in ${file}: ${before}`);
    }
    text = text.replace(before, after);
  }
  await writeFile(file, text);
}

await replace('src/game/scenes/Boot.js', [
  ['    preload() {', `    preload() {
        this.load.setBaseURL(import.meta.env.VITE_ASSET_BASE_URL || '${upstream}');`]
]);

await replace('src/game/scenes/Game.js', [
  ["'/assets/icons/useIcon.png'", "'assets/icons/useIcon.png'"]
]);

await replace('src/index.css', [
  ["url('/assets/fonts/amongus.ttf')", `url('${upstream}assets/fonts/amongus.ttf')`]
]);

await replace('index.html', [
  ['<title>Among US</title>', '<title>Among Us — VoidForge Studios</title>'],
  ['href="/favicon.png"', `href="${upstream}favicon.png"`]
]);

// The upstream sprite/map artwork is loaded from its original public repository.
// Remove the checked-out copies before Vite builds so the VoidForge Pages artifact
// contains the app bundle, not a redistributed copy of third-party game artwork.
await rm(`${root}/public/assets`, { recursive: true, force: true });
await rm(`${root}/public/favicon.png`, { force: true });
await rm(`${root}/public/kill`, { force: true });

console.log('VoidForge paths prepared; binary assets will load from the upstream repository.');
