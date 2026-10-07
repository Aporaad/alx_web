import { readdir, readFile } from 'node:fs/promises';
import { relative } from 'node:path';

const root = new URL('../src/', import.meta.url);
const projectRoot = new URL('../', import.meta.url);
const violations = [];
const forbidden = [
  /@supabase\/supabase-js/,
  /(?:VITE_|process\.env\.)SUPABASE_[A-Z0-9_]+/,
  /createClient\s*\(/,
  /\bsupabase\.(from|rpc|auth|channel|realtime|storage)\s*\(/,
  /(?:legacy-supabase|legacy-portal|legacyPortalAuth)/,
];

async function walk(url) {
  for (const entry of await readdir(url, { withFileTypes: true })) {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), url);
    if (entry.isDirectory()) await walk(child);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const source = await readFile(child, 'utf8');
      const matches = forbidden.filter((pattern) => pattern.test(source));
      if (matches.length) {
        violations.push(`${relative(projectRoot.pathname, child.pathname)}: ${matches.length} forbidden Supabase pattern(s)`);
      }
    }
  }
}

await walk(root);
if (violations.length) {
  console.error('Direct Supabase dependencies detected in alx_web source:\n' + violations.join('\n'));
  process.exit(1);
}
console.log('API-only boundary clean: no direct Supabase dependencies in alx_web source.');
