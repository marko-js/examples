import { getUsers } from "./load";

export default async (request, reply) => {
  let pageIndex = request.query.pageIndex;

  if (typeof pageIndex === "string") {
    pageIndex = parseInt(pageIndex, 10);
  } else {
    pageIndex = 0;
  }

  await reply.send(await getUsers({ pageIndex }));
};
