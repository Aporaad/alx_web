import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../src/', import.meta.url);
const restricted = ['pages', 'context', 'components', 'layouts'];
const violations = [];

async function walk(url) {
  for (const entry of await readdir(url, { withFileTypes: true })) {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), url);
    if (entry.isDirectory()) await walk(child);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const source = await readFile(child, 'utf8');
      if (/from\s+['"][^'"]*lib\/supabase['"]/.test(source)) {
        violations.push(relative(new URL('../', import.meta.url), child.pathname));
      }
    }
  }
}

for (const directory of restricted) await walk(new URL(`${directory}/`, root));
if (violations.length) {
  console.error('Portal boundary violations:\n' + violations.join('\n'));
  process.exit(1);
}
console.log('Portal boundary clean: pages, context, components, and layouts use Portal APIs.');
