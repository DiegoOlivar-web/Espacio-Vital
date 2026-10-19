import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

for (const dir of ['api', 'api/_lib', 'public', 'scripts'])
    for (const entry of readdirSync(dir))
if (entry.endsWith('.js') || entry.endsWith('.mjs'))
    execFileSync (process.execPath, ['--check', join(dir, entry)], { stdio: 'inherit' });

console.log('Sintaxis JavaScript válida');