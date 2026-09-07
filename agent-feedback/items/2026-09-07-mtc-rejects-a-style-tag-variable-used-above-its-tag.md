---
type: bug
impact: med
effort: med
site: examples/app/package.json › scripts.lint
---

# Chase down `mtc` typing a `<style/var>` as `never` when it is referenced above the `<style>` tag

Tag variables are hoisted, and the compiler honours that for a `<style>` tag's CSS-module object: a template renders the same hashed class whether the `<style>` sits above or below the markup using it. `mtc` disagrees — with the `<style>` tag placed after the element, it types the variable as `never` and fails the starter's `lint` script with `error TS2339: Property '<class>' does not exist on type 'never'`. Placing the `<style>` first is a complete workaround, so the cost is a confusing error rather than a broken build, but it lands on a documented Marko 6 feature in the one script the starter tells people to run, and the natural authoring order puts styles at the bottom of the file. The fix belongs in `@marko/type-check`; until it lands, examples that use the inline form should declare `<style/var>` above its first use, and it is worth saying so wherever the starter documents styling.

Check: in `examples/app`, create `src/tags/style-probe/index.marko` containing `<div class=styles.probe>Hello</div>` followed by a `<style/styles>` block declaring `.probe`, then run `npx mtc`. Today it exits with `src/tags/style-probe/index.marko:1:19 - error TS2339` / `Property 'probe' does not exist on type 'never'`. Moving the `<style>` block above the `<div>` clears it, and both orders serve `<div class=_probe_aahie_2>Hello</div>` from `npx marko-run` with the tag rendered by `src/routes/+page.marko`.
