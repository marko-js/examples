---
type: dx
impact: med
effort: low
site: examples/app/package.json › scripts.lint
---

# Scope the app starter's lint and format to source

`lint` runs `eslint --format unix .` and `prettier . --check` across the whole project directory, and between `eslint.config.js` globalIgnores and `.prettierignore` the only build output either one names is `dist`. Build anywhere else — `marko-run build -o dist-static`, the flag `marko-run build --help` documents — and both tools walk the emitted bundle: prettier reports the generated `.mjs`, `.js` and `.css` as unformatted, so `npm run format` would rewrite compiled output, and eslint's `css/no-invalid-properties` fails with `Can't validate with unknown variable '--brand'` whenever a layout `<style>` declares a token a page `<style>` uses, because those land in separate emitted chunks. Neither list covers dot-directories, and there the failure is worse: prettier's HTML parser rejects Marko's own SSR markup, so one saved page turns lint into `exit 2` with `SyntaxError: Opening tag "link" not terminated`, echoing the page into the terminal and burying every real lint error. Point both commands at `src` plus the config files, or extend the two ignore lists to cover any build output and dot-directories.

Check: in `examples/app`, `npx marko-run build -o dist-static && npm run lint` prints `[warn] dist-static/index.mjs` plus its two assets and exits 1 today; `mkdir .scratch && printf '<link rel=icon type=image/png sizes=32x32 href=/favicon.png>' > .scratch/page.html && npm run lint` exits 2 with the parse error. After the fix both leave `npm run lint` at exit 0 with only `src` linted.
