---
type: cleanup
impact: low
effort: low
site: examples/vite-express/package.json › description
---

# Fix the vite-express starter's stale `Remix` description and `+page.marko` edit hint

The `description` reads "Sample app that demonstrates the power of building UI components using Marko, Vite, and Remix" although the example has no Remix dependency and no Remix-style routing; its siblings read "... and Express" (`vite-express-marko-5`) and "... and Cloudflare" (`vite-cloudflare-marko-5`), so "Express" was replaced by "Remix". `src/routes/index/template.marko` renders "Edit `./src/routes/+page.marko` and save to reload", a line copied from the marko-run `basic` starter, although this example does not use @marko/run and has no `+page.marko`: its page is `src/routes/index/template.marko`, rendered by `src/routes/index/index.ts` and mounted by `src/index.ts`. Both strings ship to anyone scaffolding with `npm init marko -- --template vite-express`, and the second one sends them to edit a file that does not exist. Set the description to "... using Marko, Vite, and Express" and point the hint at `./src/routes/index/template.marko`.

Check: `cd examples/vite-express && grep -n Remix package.json` prints the `description` line, `grep -n '+page.marko' src/routes/index/template.marko` prints the `<code>` line, `find src -name '+page.marko'` prints nothing, and `grep -m1 '"description"' ../vite-express-marko-5/package.json` shows the sibling wording ending "Marko, Vite, and Express".
