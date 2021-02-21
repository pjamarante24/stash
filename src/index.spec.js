const Stash = require("../dist/index").default;

describe("Stash", () => {
  describe("when a cache manager is initialized without options", () => {
    const data = {};

    beforeAll(() => {
      data.manager = new Stash();
      data.key = "foo";
      data.value = { bar: "baz" };
    });

    test("save and return the same object", () => {
      data.manager.set(data.key, data.value);
      expect(data.manager.get(data.key)).toEqual(data.value);
    });

    test("value should be stringified", () => {
      expect(typeof data.manager.persited.get(data.key)).toEqual("string");
    });
  });
});
