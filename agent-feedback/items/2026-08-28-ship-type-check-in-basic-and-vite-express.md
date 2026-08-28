---
type: dx
impact: low
effort: low
site: examples/basic/package.json › scripts (and examples/vite-express/package.json › scripts)
---

# Ship `@marko/type-check` and a type-check script in the `basic` and `vite-express` starters

Both examples ship a `tsconfig.json` with `strict: true` and `include: ["src/**/*"]`, but neither lists `@marko/type-check` (or `typescript`) and no script runs `mtc`, so `marko-run build` and `vite build --app` happily build a project with type errors and type-checking the scaffold means discovering and installing the tool by hand. They are the exceptions in this repo: `app`, `library` and `library-ts-marko-5` all ship `@marko/type-check` and run it from `lint` as `mtc && ...`. `tsc` is not a substitute, since it skips `.marko` files, and `basic` is what `npm init marko` hands users by default, so the default scaffold has no type check of any kind despite being sold as the TypeScript starter. Add `@marko/type-check` as a devDependency plus a script that runs `mtc` in both, or say in each README that type-checking is a manual install.

Check: `for t in basic vite-express app; do node -p "'$t ' + !!require('./examples/$t/package.json').devDependencies['@marko/type-check']"; done` prints `basic false`, `vite-express false`, `app true`, and `grep -rn -iE 'mtc|type-check|typecheck' examples/basic examples/vite-express --exclude-dir=node_modules` exits 1 with no hit although both directories contain a `tsconfig.json`. The addition is purely additive: in a copy of `examples/basic`, `npm install && npm install -D @marko/type-check && npx mtc` exits 0 with no output today.
