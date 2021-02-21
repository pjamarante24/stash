const Stash = require("../lib/index").default;
const Benchmark = require("./utils/benchmark");
const fetch = require("./utils/fetch");

const cache = new Stash();

const testFn = async () => {
  const key = "foo";
  const has = cache.has(key);

  if (has) {
    const value = cache.get(key);
  } else {
    const data = await fetch("https://jsonplaceholder.typicode.com/todos/1");
    cache.set(key, data);
    await cache.save();
  }
};

Benchmark.setTitle("Default config")
  .add(testFn)
  .add(testFn)
  .add(testFn)
  .add(testFn)
  .add(testFn)
  .add(testFn)
  .run()
  .then(() => process.exit(0));
