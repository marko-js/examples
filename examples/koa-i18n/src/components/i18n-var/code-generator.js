'use strict';

module.exports = function(el, codegen) {
    // We will dynamically add a new <var name="i18n" value="out.global.i18n"> tag
    // at compile-time using this code generator for the custom tag.

    var builder = codegen.builder;

    var nameAttrValue = el.getAttributeValue('name');
    var name = nameAttrValue ? nameAttrValue.value : null;

    return builder.var(name || 'i18n', 'out.global.i18n');
};