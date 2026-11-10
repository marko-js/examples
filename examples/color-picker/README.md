# Building a Color Picker

<p align="center">
  <img width="100%" src="https://user-images.githubusercontent.com/3771924/26844826-b2334098-4ac2-11e7-81ac-ca2280ef3bbd.png">
</p>

## Introduction

In this tutorial we build a color picker out of a few small Marko tags. Along the way we will:

- Create a project with `npm init marko`
- Split a UI into custom tags and pass them `input`
- Keep state with `<let>` and share it with child tags through two-way binding (`:=`)
- Style tags with `<style>` blocks and auto-discovered style files
- Import a JavaScript module into a tag

## Getting Started

Create a project from this example, then start the development server:

```bash
npm init marko -- --template color-picker
cd ./marko-app
npm run dev
```

The page lives in `src/routes/+page.marko`, and the tags it uses live in `src/tags/`.

## Creating a Tag

Marko discovers custom tags in `src/tags/` automatically, so creating `src/tags/color-picker/index.marko` makes a `<color-picker>` tag available everywhere. Let's start by listing the colors it is given:

**src/tags/color-picker/index.marko**

```marko
export interface Input {
  colors: string[];
}

<ul>
  <for|color| of=input.colors>
    <li style={ color }>${color}</li>
  </for>
</ul>
```

`input` holds the attributes a tag is rendered with, and the `Input` interface describes them for TypeScript. The page passes the colors:

**src/routes/+page.marko**

```marko
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marko | Color Picker</title>
  </head>
  <body>
    <sample-header title="Color Picker"/>
    <div class="color-picker-container">
      <color-picker colors=[
        "#333745",
        "#E63462",
        "#FE5F55",
        "#C7EFCF",
        "#EEF5DB",
        "#00B4A6",
        "#007DB6",
        "#FFE972",
        "#9C7671",
        "#0C192B",
      ]/>
    </div>
  </body>
</html>

<style>
  body {
    margin: 0 auto;
    font-family: system-ui, sans-serif;
    text-align: center;
  }
  .color-picker-container {
    display: flex;
    justify-content: center;
    padding-top: 2em;
  }
</style>
```

The page now shows a list of the colors we passed in.

## Child Tags

A color picker has a few distinct parts, so let's give each one its own tag:

- `<color-picker-header>` shows the selected color and its hex value
- `<color-picker-selection>` is a single swatch to click
- `<color-picker-footer>` holds the swatches and a hex input

Each gets a folder of its own in `src/tags/`:

```
src/tags/
  color-picker/
    index.marko
  color-picker-footer/
    index.marko
    style.css
  color-picker-header/
    index.marko
  color-picker-selection/
    index.marko
```

### Header

The header only displays what it is given. Its styles sit beside the markup in a `<style>` block, which is bundled and loaded once no matter how many times the tag renders.

**src/tags/color-picker-header/index.marko**

```marko
export interface Input {
  color: string;
}

<div class="color-picker-header" style={ "background-color": input.color }>
  <p>${input.color}</p>
</div>

<style>
  .color-picker-header {
    width: 200px;
    height: 100px;
    border-radius: 20px 20px 0 0;
    font: 30px Arial;
    display: flex;
    flex-direction: column;
    text-align: center;
    color: white;
  }
  .color-picker-header > p {
    padding-top: 1.15em;
    margin: 0;
  }
</style>
```

> **Note:** the keys of a `style={}` object are written out as-is, so they are CSS property names such as `background-color`, not the camelCased DOM names.

### Selection

A swatch is a button that calls the `onSelect` function it receives when clicked:

**src/tags/color-picker-selection/index.marko**

```marko
export interface Input {
  color: string;
  onSelect: () => void;
}

<button
  type="button"
  class="color-picker-selection"
  aria-label=input.color
  style={ "background-color": input.color }
  onClick=input.onSelect
/>

<style>
  .color-picker-selection {
    width: 25px;
    height: 25px;
    padding: 0;
    border: 0;
    border-radius: 5px;
    margin: 5px 0px 0px 5px;
    float: left;
    cursor: pointer;
  }
</style>
```

### Footer

The footer renders a swatch for each color, plus an input for typing a hex value. It doesn't own the selected color: it receives it as `color`, and reports a new one by calling `colorChange`.

**src/tags/color-picker-footer/index.marko**

```marko
export interface Input {
  colors: string[];
  color: string;
  colorChange: (color: string) => void;
}

<div class="color-picker-footer">
  <div class="color-picker-selection-container">
    <for|color| of=input.colors>
      <color-picker-selection
        color=color
        onSelect() {
          input.colorChange(color);
        }
      />
    </for>
    <input/$hexInput
      aria-label="Hex value"
      placeholder="Hex value"
      onInput() {
        const { value } = $hexInput();
        const hex = value.startsWith("#") ? value : `#${value}`;

        if (isHexColor(hex)) {
          input.colorChange(hex);
        }
      }
    >
  </div>
</div>

static function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}
```

`<input/$hexInput>` gives the input an element reference, so the handler reads the typed value with `$hexInput()`. The `static function` is defined once for the module rather than for each render. The footer's styles live in `style.css` next to `index.marko`, which Marko picks up automatically:

**src/tags/color-picker-footer/style.css**

```css
.color-picker-footer {
  width: 200px;
  height: 100px;
  border-radius: 0px 0px 20px 20px;
  font: 30px Arial;
  display: flex;
  flex-direction: column;
  text-align: center;
  color: white;
  box-shadow: 0px 3px 5px #888888;
}
.color-picker-selection-container {
  width: 75%;
  margin: 5px 0px 0px 20px;
}
.color-picker-selection-container input {
  margin-top: 8px;
  border-radius: 0px 0px 0px 0px;
  border-width: 0px 0px 1px 0px;
  outline: none;
  color: #a9a9a9;
}
```

### Putting It Together

Now `<color-picker>` holds the selected color in a `<let>` and passes it to both children:

**src/tags/color-picker/index.marko**

```marko
import { defaultColors } from "../../util/default-colors";

export interface Input {
  colors?: string[];
}

<const/colors=input.colors || defaultColors>
<let/selectedColor=colors[0]>

<div class="color-picker">
  <color-picker-header color=selectedColor/>
  <color-picker-footer colors=colors color:=selectedColor/>
</div>
```

`color:=selectedColor` is two-way binding. It passes `color=selectedColor` along with a `colorChange` function that assigns the new value to `selectedColor`. When the footer calls `colorChange`, `selectedColor` updates, and the header re-renders with it.

The `<const>` falls back to a default palette when no `colors` are passed. That palette comes from a plain module:

**src/util/default-colors.ts**

```ts
export const defaultColors = [
  "#1ABC9C",
  "#2ECC71",
  "#3498DB",
  "#9B59B6",
  "#34495E",
  "#16A085",
  "#27AE60",
  "#2980B9",
  "#8E44AD",
  "#2C3E50",
];
```

Modules are imported with the usual `import` syntax at the top of a template.

Congratulations, the color picker is done! Click a swatch or type a hex value such as `ff8800` to change the header.

## Testing

For testing Marko tags we recommend [Marko Testing Library](https://github.com/marko-js/testing-library).

## Additional Resources

- [Marko documentation](https://markojs.com/docs/introduction/welcome-to-marko)
- [Two-way binding](https://markojs.com/docs/reference/language#shorthand-change-handlers-two-way-binding)
- [@marko/run](https://github.com/marko-js/run)
- [Marko Testing Library](https://github.com/marko-js/testing-library)

---

> Special thanks to [Anthony Ng](https://github.com/newyork-anthonyng) for writing the original version of this tutorial!
