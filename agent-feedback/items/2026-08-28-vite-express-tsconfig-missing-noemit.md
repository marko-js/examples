---
type: bug
impact: med
effort: low
site: examples/vite-express/tsconfig.json › compilerOptions
---

# Add `noEmit: true` to the vite-express starter's tsconfig so type-checking cannot overwrite `dist/index.js`

This example carries the library template's emitting config (`outDir: "dist"`, `rootDir: "src"`, `incremental`, `tsBuildInfoFile: "dist/tsconfig.tsbuildinfo"`, no `noEmit`), while `examples/basic`, `examples/app` and the tsconfig the installation docs recommend all set `"noEmit": true`. `vite build --app` writes the SSR bundle to `dist/index.js`, so type-checking after a build emits `.js`, `.d.ts`, `.marko` and `.d.marko` into that same `dist/` and replaces the 8.7 kB bundle with the 135 byte transpile of `src/index.ts`; `npm start` then dies with `ERR_UNKNOWN_FILE_EXTENSION ".marko"`, and nothing warns. `mtc` is not required to spring it: a bare `tsc` clobbers the bundle too, and does so while exiting non-zero on `TS2307: Cannot find module './template.marko'`. Since `build` starts with `rimraf dist`, a check-then-build order recovers and the natural build-then-check order (and `npm run preview`) does not. Add `"noEmit": true` and drop the now dead `outDir`, `rootDir`, `incremental` and `tsBuildInfoFile` to match `examples/basic`.

Check: `cp -r examples/vite-express /tmp/ve && cd /tmp/ve && npm install && npm install -D @marko/type-check && npm run build && sha256sum dist/index.js && npx mtc; sha256sum dist/index.js; head -3 dist/index.js; PORT=4850 npm start`. Today `mtc` exits 0 with no output, `dist/index.js` goes from 8717 bytes to 135 bytes whose first lines are `import { Router } from "express";` / `import indexPage from "./routes/index/index.js";`, and start exits 1 with `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".marko" for /tmp/ve/dist/routes/index/template.marko`. With `"noEmit": true` in the tsconfig the hash is unchanged and `dist` gains only `dist/tsconfig.tsbuildinfo`.
