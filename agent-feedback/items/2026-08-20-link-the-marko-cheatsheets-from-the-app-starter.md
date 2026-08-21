---
type: dx
impact: med
effort: low
site: examples/app/README.md
---

# Point the app starter at the cheat sheets shipped in `node_modules`

`marko` ships a 226-line `cheatsheet.md` at its package root and `@marko/run` ships a 114-line one, and they are the densest syntax references available for writing `.marko` templates and route files. Nothing the starter owns links either: `grep -ri cheat` over `examples/app` hits only the generated `.marko-run/routes.d.ts` header, which points at the `@marko/run` sheet alone, so the marko sheet is undiscoverable. There is also no `AGENTS.md`/`CLAUDE.md`, so the first orientation command an agent runs finds nothing, and the starter's own conventions (the vitest test-file naming, `npm run format` as the fix for a failing `npm run lint`, husky/lint-staged) go unstated. A README line naming `node_modules/marko/cheatsheet.md` and `node_modules/@marko/run/cheatsheet.md`, plus a short `AGENTS.md` carrying those conventions, is the whole fix.

Check: `grep -ril cheat examples/app --exclude-dir=node_modules` returns only `.marko-run/routes.d.ts` today and `ls examples/app/AGENTS.md` fails; after the fix `README.md` names both cheat sheet paths.
