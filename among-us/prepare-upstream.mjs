import { readFile, writeFile } from 'node:fs/promises';

const root = 'among-us/frontend';

async function replace(path, pairs) {
  const file = root + '/' + path;
  let source = await readFile(file, 'utf8');
  for (const [before, after] of pairs) {
    if (!source.includes(before)) {
      if (source.includes(after)) continue;
      throw new Error('Expected source marker not found in ' + file + ': ' + before);
    }
    source = source.replace(before, after);
  }
  await writeFile(file, source);
}

await replace('src/game/scenes/Game.js', [
  ["'/assets/icons/useIcon.png'", "'assets/icons/useIcon.png'"]
]);

await replace('src/index.css', [
  ["url('/assets/fonts/amongus.ttf')", "url('assets/fonts/amongus.ttf')"]
]);

await replace('index.html', [
  ['<title>Among US</title>', '<title>Among Us — VoidForge Studios</title>'],
  ['href="/favicon.png"', 'href="favicon.png"']
]);

console.log('VoidForge paths prepared; game artwork is served from the copied local assets.');
