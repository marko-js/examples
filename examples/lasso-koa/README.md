Sample App: Marko + Koa
======================================

This sample app illustrates how to integrate Marko with a very basic Koa app. For this sample app, we use the streaming API to stream the output of the template rendering to the HTTP response stream. In addition, this sample application illustrates how to create custom tags that can be embedded into your templates.

# Installation

```
npx @marko/create marko-app --template lasso-koa 
cd marko-app
npm install
npm run dev
```

Navigate to [http://localhost:8080/](http://localhost:8080/) to see your server in action!
