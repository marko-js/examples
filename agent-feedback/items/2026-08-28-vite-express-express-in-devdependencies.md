---
type: bug
impact: med
effort: low
site: examples/vite-express/package.json › devDependencies
---

# Move `express` (and `cross-env`) to `dependencies` so the vite-express starter starts after a production install

`index.ts` imports express and the built `dist/index.js` begins `import { Router } from "express";`, yet `express` and `cross-env` sit in `devDependencies` while `start` is `cross-env NODE_ENV=production node --enable-source-maps index.ts`. So the README's "build a production-ready node.js server (`npm run start` to start it)" does not survive a production install: after `npm install --omit=dev`, `npm start` exits 127 with `cross-env: command not found`, and running node on `index.ts` directly throws `ERR_MODULE_NOT_FOUND: Cannot find package 'express'`. Every sibling server example puts its runtime server dependency in `dependencies` (`vite-express-marko-5`, `webpack-express-marko-5` and `rollup-express-marko-5` for express, `vite-fastify-marko-5` for fastify), and this example already separates runtime from build time by keeping `marko` in `dependencies`. Move `express` there, and either move `cross-env` too or drop the `NODE_ENV=production` prefix, which nothing reads at runtime (`cross-env` is what makes that script work on Windows, so do not replace it with a bare assignment). Separately, `express.static("dist/assets")` is cwd relative, so starting the server from any other directory serves `/` with 200 while every `/assets/*` the page links 404s; resolve that root from `import.meta.dirname`.

Check: `cp -r examples/vite-express /tmp/ve && cd /tmp/ve && npm install && npm run build && rm -rf node_modules package-lock.json && npm install --omit=dev; PORT=4935 npm start`, which today prints `sh: line 1: cross-env: command not found` and exits 127; `PORT=4935 NODE_ENV=production node index.ts` then exits 1 with `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express' imported from /tmp/ve/index.ts`. For the static root, with dev dependencies installed run `cd /tmp && PORT=4935 NODE_ENV=production node /tmp/ve/index.ts` and `curl -o /dev/null -w '%{http_code}\n' localhost:4935/ localhost:4935/assets/<hashed>.js`: 200 then 404, against 200 and 200 when started from the project directory.
