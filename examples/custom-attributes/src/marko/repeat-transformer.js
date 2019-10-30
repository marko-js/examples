'use strict';

module.exports = function transform(el, context) {
    let repeat = el.getAttribute('repeat');
    if (!repeat || !repeat.argument) {
        return;
    }

    // Remove the attribute so that it is not rendered to the HTML output
    el.removeAttribute('repeat');

    // Parse the String argument into a JavaScript expression
    var toExpression = context.builder.parseExpression(repeat.argument);

    // Create a new ForRange AST node to loop the correct number of times
    var forRangeNode = context.builder.forRange(
        '__repeatIndex' /* var name */,
        context.builder.literal(1) /* start range */,
        toExpression /* end range (inclusive) */ );

    // Wrap the current element in a new ForRange AST node
    el.wrapWith(forRangeNode);
};