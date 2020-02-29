import { getUsers } from "./users";

export default function(app) {
  app.get("/services/users", async (req, res) => {
    let pageIndex = req.query.pageIndex;

    if (typeof pageIndex === "string") {
      pageIndex = parseInt(pageIndex, 10);
    } else {
      pageIndex = 0;
    }

    try {
      res.json(await getUsers({ pageIndex }));
    } catch (err) {
      console.log(err);
      res.status(500).send("Unable to load users");
    }
  });
};
