var template = require('./template.marko');

module.exports = (ctx, next) => {
    ctx.type = 'html';
    ctx.body = template.stream({
        // Adding the `i18n` variable to $global is required so
        // that it will be available as `out.global.i18n` during
        // template rendering.
        $global: {
            i18n: ctx.i18n
        }
    });
};