'use strict';

const mime = require('mime');
const fs = require('fs');
const path = require('path');

module.exports = function transform(el, context) {
    let base64SrcExpression = el.getAttributeValue('base64-src');
    /*
    base64SrcExpression is an AST node that represents the attribute value parsed as a JavaScript expression.
    The JavaScript expression may be either a literal String value, or a dynamic JavaScript expression.
     */


    if (!base64SrcExpression) {
        return;
    }

    let builder = context.builder;

    el.removeAttribute('base64-src'); // This attribute is handled at compile time. We can just remove it now

    if (base64SrcExpression.type === 'Literal') {
        /*
        The path is a literal value that we can process at compile-time. Our goal is to set the "src" attribute
        to the base64 encoded URL.

        The AST for `"./marko-logo.png"` looks like the following:
        {
            type: 'Literal',
            value: './marko-logo.png'
        }
        */

        let templateDir = context.dirname;
        let imagePath = path.resolve(templateDir, base64SrcExpression.value);
        let data = fs.readFileSync(imagePath);
        let dataUrl = 'data:' + mime.lookup(imagePath) + ';' + 'base64' + ',' + data.toString('base64');
        el.setAttributeValue('src', builder.literal(dataUrl));

        // End result:
        // <img width=150 height=125 src="data:image/png;base64,...">
    } else {
        context.error("The base64-src attribute must be a literal string value.")
    }
};