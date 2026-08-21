---
type: bug
impact: med
effort: low
site: examples/app/eslint.config.js › files ["**/*.css"]
---

# Make the app starter's CSS rules agree between `.module.css` and `.marko` `<style>`

The `css.configs.recommended` block in the starter's eslint config only matches `**/*.css`, so a `<style>` block in a `.marko` file is never linted at all — even `totally-bogus-property: 1px` passes — while the identical declarations in a sibling `styles.module.css` are hard errors. `css/no-invalid-properties` reports `Can't validate with unknown variable '--muted'` for any design token declared in another file, which is the first thing a CSS module does, and `css/use-baseline` rejects `font-family: ui-monospace, monospace`. Marko supports both places to write CSS, so the starter currently gives them opposite treatment and pushes users toward worse code (`var(--muted, #6b7280)`, or deleting the font stack). Either relax those two rules in the starter config or extend the CSS language to `.marko` style blocks.

Check: declare `--muted: #6b7280` in the `<style>` block of `examples/app/src/routes/+layout.marko`, add `color: var(--muted); font-family: ui-monospace, monospace;` to `src/tags/char-count/styles.module.css`, and run `npx eslint --format unix .` — today two `Error/css/*` lines on the `.module.css` and silence on the `.marko`; after the fix the two files should be treated the same.
