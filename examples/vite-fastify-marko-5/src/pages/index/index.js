import template from "./template.marko";
export default async (app) => {
  app.get("/", (request, reply) => {
    reply.marko(template, {});
  });
};
