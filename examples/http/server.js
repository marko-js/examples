'use strict';

require('marko/node-require').install();

const server = require('http').createServer();
const indexTemplate = require('./src/pages/index.marko');
const port = 8080;

server.on('request', (req, res) => {
  indexTemplate.render({
    name: 'Frank',
    count: 30,
    colors: ['red', 'green', 'blue']
  }, res);
});

server.listen(port, () => {
  console.log(`Successfully started server on port ${port}`);
});
