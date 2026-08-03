import { readFile } from 'node:fs/promises';
const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
if (page.includes('noindex, nofollow') && process.env.ALLOW_PLACEHOLDER_BUILD !== '1') {
  console.error('Build blocked: placeholder page still contains noindex. Set ALLOW_PLACEHOLDER_BUILD=1 only for local checks.');
  process.exit(1);
}
