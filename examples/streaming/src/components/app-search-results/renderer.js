var template = require('./template.marko');
var EventEmitter = require('events').EventEmitter;
var searchResultsData = require('./fake-data.json');
var pageSize = 3;

/**
 * This helper function returns a page of search results from our
 * fake search results data.
 */
function getSearchPage(pageIndex) {
    var start = pageIndex * pageSize;

    var items = [];

    for (var i=start; i<start+pageSize; i++) {
        items.push(searchResultsData.items[i % searchResultsData.items.length]);
    }

    return items;
}

function getSearchResultsStream() {

    // We will actually use an event emitter, but this could just as
    // easily be a stream.
    var ee = new EventEmitter();

    var pageIndex = 0;

    /**
     * This function emits the event that contains the  next page of search results.
     * If we have reached the max number of pages then we emit the "end" event.
     * Otherwise, we schedule another page after a fixed delay.
     */
    function nextPage() {
        var items = getSearchPage(pageIndex);
        ee.emit('data', items);
        pageIndex++;

        if (pageIndex < 10) {
            // Let's keep going until 10 pages of search results
            // are provided...
            setTimeout(nextPage, 1000);
        } else {
            // Let's let the caller know that there are no more search results
            ee.emit('end');
        }
    }

    // Wait until the next tick to provide the first page of search
    // results so that the calling code has time to attach the
    // event listeners
    process.nextTick(nextPage);

    return ee;
}

module.exports = function(input, out) {
    // Begin an async fragment that we will asynchronously render
    // the search results to. When there is no more data we will
    // end the async fragment and that will end the HTML stream.
    var asyncOut = out.beginAsync({
        timeout: 0 /* disable the timeout */
    });
    var searchResultsStream = getSearchResultsStream();

    searchResultsStream
        .on('data', function(items) {
            // Render out the current page of results to our
            // async fragment.
            template.render({
                items: items
            }, asyncOut);

            // Force the output HTML to be flushed (it is buffered by default)
            asyncOut.flush();
        })
        .on('end', function() {
            // If there are no more search results then end the async ragment
            asyncOut.end();
        });
};
