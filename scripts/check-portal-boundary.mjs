import { readdir, readFile } from 'node:fs/promises';
import { relative } from 'node:path';

const projectRoot = new URL('../', import.meta.url);
const srcRoot = new URL('../src/', import.meta.url);
const violations = [];
const forbidden = [
  /@supabase\/supabase-js/,
  /(?:VITE_|process\.env\.)SUPABASE_[A-Z0-9_]+/,
  /createClient\s*\(/,
  /\bsupabase\.(from|rpc|auth|channel|realtime|storage)\s*\(/,
  /(?:legacy-supabase|legacy-portal|legacyPortalAuth)/,
  /(?:from|import)\s*\(?\s*['"][^'"]*supabase[^'"]*['"]/i,
];

function report(label, source) {
  const matches = forbidden.filter((pattern) => pattern.test(source));
  if (matches.length) violations.push(`${label}: ${matches.length} forbidden Supabase pattern(s)`);
}

async function walk(url) {
  for (const entry of await readdir(url, { withFileTypes: true })) {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), url);
    if (entry.isDirectory()) await walk(child);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      report(relative(projectRoot.pathname, child.pathname), await readFile(child, 'utf8'));
    }
  }
}

// افحص مصدر الموقع — Scan the portal source tree.
await walk(srcRoot);

// افحص ملفات إعداد البناء في الجذر — Scan root build-config files (e.g. vite manualChunks).
for (const name of ['vite.config.ts']) {
  try {
    report(name, await readFile(new URL(name, projectRoot), 'utf8'));
  } catch {
    // الملف غير موجود — config file absent; nothing to scan.
  }
}

if (violations.length) {
  console.error('Direct Supabase dependencies detected in alx_web source or build config:\n' + violations.join('\n'));
  process.exit(1);
}
console.log('API-only boundary clean: no direct Supabase dependencies in alx_web source or build config.');
