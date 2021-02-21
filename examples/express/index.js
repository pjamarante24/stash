const express = require("express");

const { Stash } = require("@pamarante24/stash");

const cache = new Stash({ ttl: 5, checkPeriod: 10, verbose: true });

const app = express();

app.get("/", async (req, res) => {
  const key = "foo";
  const has = await cache.has(key);

  if (has) {
    const value = await cache.get(key);
    res.send({ type: "HIT", value });
  } else {
    await cache.set(key, { foo: new Date().getTime() });
    await cache.save();
    res.send({ type: "MISS" });
  }
});

app.listen(3000, () => console.log("Server started at http://localhost:3000"));
