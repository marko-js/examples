require('marko/node-require').install();

var Koa = require('koa');
var serve = require('koa-static');
var locale = require('koa-locale');
var i18n = require('koa-i18n');

var app = new Koa();

locale(app);

app.use(i18n(app, {
    directory: './locales',
    locales: ['en', 'es'],
    modes: [
        'query',                //  optional detect querystring - `/?locale=en-US`
        'subdomain',            //  optional detect subdomain   - `zh-CN.koajs.com`
        'cookie',               //  optional detect cookie      - `Accept-Language: zh-CN,zh;q=0.5`
        'header',               //  optional detect header      - `Cookie: locale=zh-TW`
        'url',                  //  optional detect url         - `/en`
        'tld'                   //  optional detect tld(the last domain) - `koajs.cn`
    ]
}));

app.use(serve('./public'));

app.use(require('./src/pages/home'));

var port = 8080;

app.listen(8080, function() {

    console.log('Server started! Try it out:\nhttp://localhost:' + port + '/');

    if (process.send) {
        process.send('online');
    }
});
