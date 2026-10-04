import { mkdir, cp, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
await rm(new URL('dist/', root), { recursive: true, force: true });
await mkdir(new URL('dist/', root));
for (const name of ['index.html', 'lab.html', 'styles.css', 'finder.css', 'src', 'assets']) {
  await cp(new URL(name, root), new URL(`dist/${name}`, root), { recursive: true });
}
process.stdout.write('Statische Anwendung nach dist/ kopiert.\n');
