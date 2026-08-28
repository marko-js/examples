---
type: dx
impact: low
effort: low
site: examples/basic/README.md
---

# Make the basic starter's README match `npm init marko` and describe the scaffold

This is the README shipped with the default template, and its install block is wrong twice: `cd marko-app` fails because create-marko puts the project in `resolve(dir, name)` with `name` defaulting to `my-app`, and the `npm install` line is redundant because the CLI installs unless `--no-install` is passed, ending on `Next steps: cd <dir> / npm run dev`. The Overview lists `dev`, `build` and `preview` but not `start` (`node --enable-source-maps ./dist/index.mjs`), which is the only way to run what `npm run build` produced. Nothing names the files the scaffold creates either: `src/routes/+layout.marko`, `src/routes/+meta.json`, `src/tags/mouse-mask.marko`, `tsconfig.json` and the generated `.marko-run/` all go unmentioned, so the first orientation pass has to come from `find`. Rewrite it on the shape of `examples/app/README.md`, which names `src/routes` and `src/tags` and lists the scripts including `npm start`, and while there fix the identical stale install block in `examples/vite-express/README.md`.

Check: `cat examples/basic/README.md` shows `cd marko-app` / `npm install` and an Overview of dev, build and preview only, while `node -p "Object.keys(require('./examples/basic/package.json').scripts)"` prints `[ 'dev', 'build', 'preview', 'start' ]`. Against the real scaffolder, `npm i --no-save @marko/create@6.3.0 && node node_modules/@marko/create/dist/bin.mjs --dir scaffold --yes --no-install --no-git` creates `scaffold/my-app/`, not `marko-app`, and `diff scaffold/my-app/README.md examples/basic/README.md` prints nothing; dropping `--no-install` prints `Next steps:` with `cd <dir>` and `npm run dev` and no install step, with `node_modules/` already in place.
