'use strict';

require('marko/node-require');

const Hapi = require('@hapi/hapi');

const indexTemplate = require('./src/pages/index.marko');

const server = new Hapi.server({
  port: 8080,
  host: 'localhost'
});

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    const response = reply.response(indexTemplate.stream({
      name: 'Frank',
      count: 30,
      colors: ['red', 'green', 'blue']
    }));
    response.type('text/html');
    return response;
  }
});

server.route({
  method: 'GET',
  path: '/logo.png',
  handler: (request, h) => {
    return h.file('./public/logo.png')
  }
})

async function liftOff () {  
  await server.register({
    plugin: require('@hapi/inert')
  })

  await server.start()
  console.log('Hapi server started at: ' + server.info.uri)
}

liftOff() 
