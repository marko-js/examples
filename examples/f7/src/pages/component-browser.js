require('framework7');

module.exports = {
    onMount() {
        const myApp = new Framework7();
        myApp.addView('.view-main', {
            // Because we want to use dynamic navbar, we need to enable it for this view:
            dynamicNavbar: false,
            domCache: true // for inline pages
        });
    }
}