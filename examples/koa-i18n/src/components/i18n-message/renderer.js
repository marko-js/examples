module.exports = function(input, out) {
    var i18n = out.global.i18n;
    var key = input.key;
    out.write(i18n.__(key));
};