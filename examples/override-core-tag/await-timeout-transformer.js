module.exports = function (el, context) {
    if (!el.hasAttribute('timeout')) {
        el.setAttributeValue('timeout', context.builder.literal(30000));
    }
}
