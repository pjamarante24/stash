const { performance } = require("perf_hooks");

class Benchmark {
  static setTitle(title) {
    this.title = title;
    return this;
  }

  static add(task) {
    if (!this.tasks) this.tasks = [];
    this.tasks.push(task);
    return this;
  }

  static async run() {
    console.log(`_${this.title}_`);
    console.log("Running tasks...");
    const now = performance.now();
    const each = [];

    for (const task of this.tasks) {
      const start = performance.now();
      try {
        await task();
      } catch (error) {}
      const end = performance.now();

      each.push(end - start);
    }

    const total = performance.now() - now;

    this.log({ total, each });
  }

  static log({ total, each }) {
    console.log("Time per task (ms): ");
    console.table(each);

    console.log(`Total time: ${total}ms \n\n`);
  }
}

module.exports = Benchmark;

// const delayFn = (time) => () =>
//   new Promise((resolve) => {
//     setTimeout(() => {
//       resolve();
//     }, time);
//   });

// Benchmark.add(delayFn(500))
//   .add(delayFn(1000))
//   .add(delayFn(2000))
//   .add(delayFn(3000))
//   .run();
