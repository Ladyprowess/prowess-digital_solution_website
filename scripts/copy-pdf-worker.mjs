// Copies Mozilla's pdf.js library and its worker into public/pdfjs/.
//
// PdfViewer loads both straight from /pdfjs as native ES modules, hidden
// from the bundler (webpackIgnore), instead of importing "pdfjs-dist".
// Going through webpack is what kept breaking: with the esmExternals
// interop this project needs for other packages, the import handed back a
// wrapper whose GlobalWorkerOptions and getDocument were undefined, so the
// reader threw before it ever fetched a file - every PDF fell through to
// the fallback and the listen controls (same library) died with it.
//
// pdf.js also hard-fails when the worker's version differs from the API
// that loaded it, so both files are copied together from the same install.
// Running on predev/prebuild makes an npm update impossible to forget.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const pkgPath = require.resolve("pdfjs-dist/package.json");
const buildDir = join(dirname(pkgPath), "build");
const outDir = join(root, "public", "pdfjs");
const version = JSON.parse(readFileSync(pkgPath, "utf8")).version;

const FILES = ["pdf.min.mjs", "pdf.worker.min.mjs"];

mkdirSync(outDir, { recursive: true });

let copied = 0;
for (const file of FILES) {
  const source = join(buildDir, file);
  if (!existsSync(source)) {
    console.error(`[pdfjs] Not found: ${source}. Is pdfjs-dist installed?`);
    process.exit(1);
  }
  const target = join(outDir, file);
  if (existsSync(target) && readFileSync(target).equals(readFileSync(source))) continue;
  copyFileSync(source, target);
  copied += 1;
}

console.log(
  copied > 0
    ? `[pdfjs] Copied ${copied} file(s) from pdfjs-dist ${version} to public/pdfjs/`
    : `[pdfjs] public/pdfjs/ already matches pdfjs-dist ${version}`
);
