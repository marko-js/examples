const gulp = require('gulp')
const directoryName = 'public';
const fs = require('fs')
let isDev = process.argv.indexOf('--dev') >= 0;
let isProd = !isDev;
require('marko/node-require');

require('lasso').configure({
    "plugins": [{
        "plugin": "lasso-marko"
    }, {
        "plugin": "lasso-less"
    }],
    "fileWriter": {
        "outputDir": `${directoryName}/static`,
        "fingerprintsEnabled": isProd,
        "urlPrefix": "static/"
    },
    "minify": isProd,
    "resolveCssUrls": true,
    "bundlingEnabled": false,
    "bundles": []
});

gulp.task('mkdir', function () {
    var outputDirectory = path.dirname(`./${directoryName}`)

    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory)
    }
})



gulp.task('copy', function () {

    return gulp.src(['./images/**/*'])
        .pipe(gulp.dest(`./${directoryName}/images`))


});

gulp.task('marko', ['copy'], function (cb) {


    return renderPage('app-root', 'index.html');
    // return Promise.all([
    //     renderPage('app-root'),
    //     renderPage('schedule'),
    //     renderPage('proposal-list'),
    //     renderPage('proposal'),
    //     renderPage('profile'),
    //     renderPage('speakers')
    // ]);



})

function renderPage(pageName, htmlFileName) {
    return new Promise(function (resolve, reject) {
        let main = require(`./src/components/${pageName}/${pageName}`);
        var htmlProm = main.render({});

        htmlProm.then((html) => {

            fs.writeFileSync(`./${directoryName}/` + htmlFileName, html)

            console.log('done rendering: ', `${htmlFileName}`)
            resolve();
        })

    })
}


gulp.task('default', ['marko']);