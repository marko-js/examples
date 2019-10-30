import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import marko from "@marko/rollup";
import postcss from "rollup-plugin-postcss";

import path from 'path';

export default {
    input: path.join(__dirname, './src/pages/index/template.marko'),
    plugins: [
        marko(),
        nodeResolve({
            browser: true,
            extensions: [".js", ".marko"]
        }),
        // NOTE: Marko 4 compiles to commonjs, this plugin is also required.
        commonjs({
            extensions: [".js", ".marko"]
        }),
        // If using `style` blocks with Marko you must use an appropriate plugin.
        postcss({
            external: true
        })
    ],
    output: {
        file: path.join(__dirname, './static/bundle.js'),
        format: 'iife',
        name: 'app'
    }
};