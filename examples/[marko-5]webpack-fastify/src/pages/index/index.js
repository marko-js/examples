import Template from "./template.marko";

export default async (request, reply) => {
  await reply.marko(Template, {});
};
