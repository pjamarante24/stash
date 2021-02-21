const https = require("https");

const fetch = (path) => {
  return new Promise((resolve, reject) => {
    https
      .get(path, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve(JSON.parse(data));
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

module.exports = fetch;
