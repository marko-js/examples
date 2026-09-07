---
type: dx
impact: med
effort: low
site: examples/app/vitest.config.ts › defineConfig
---

# Set `test.css` in the app starter so a `<style/var>` CSS module keeps its class names under Vitest

A `<style>` tag given a tag variable exposes its classes as a CSS module object, but Vitest leaves CSS unprocessed unless `test.css` is set, so the stylesheet the compiler generates for that tag never reaches Vite's CSS-modules transform and every `class=styles.foo` renders with no `class` attribute at all. The same template served by `marko-run` gets a hashed class, so a component test quietly asserts against different markup than the app ships, with nothing failing to point at the cause. The gap is easy to miss because the file-based `styles.module.css` form the starter itself uses does get a hashed class under the current config — that is where the committed `char-count` snapshot's `_input_39ddf7` comes from. Add `css: true` to the shared `test` block, which both projects extend.

Check: in `examples/app`, create `src/tags/style-probe/index.marko` containing a `<style/styles>` block declaring `.probe` followed by `<div class=styles.probe>Hello</div>`, and a `server.test.ts` that renders it and reads `screen.getByText("Hello").outerHTML`. Today `npx vitest run --project server src/tags/style-probe` reports `"<div>Hello</div>"`; adding `css: true` reports `"<div class=\"_probe_174bd7\">Hello</div>"`, and `npx vitest run --project server` still passes the committed `char-count` snapshot unchanged. For the reference rendering, point `src/routes/+page.marko` at the same tag and `curl` `npx marko-run`, which serves `<div class=_probe_aahie_2>Hello</div>` either way.
