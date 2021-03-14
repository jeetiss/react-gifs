const rollup = require("rollup");
const resolve = require("@rollup/plugin-node-resolve").default;
const virtual = require("@rollup/plugin-virtual");
const commonjs = require("@rollup/plugin-commonjs");
const inject = require("@rollup/plugin-inject");
const playwright = require("playwright");

const buildFns = () => {
  const nextTick = (fn) => queueMicrotask(fn);

  const hrtime = () => {
    var clocktime = performance.now() * 1e-3;
    var seconds = Math.floor(clocktime);
    var nanoseconds = Math.floor((clocktime % 1) * 1e9);

    return [seconds, nanoseconds];
  };

  return `{ nextTick: ${nextTick}, hrtime: ${hrtime} }`;
};

async function build() {
  // create a bundle
  const bundle = await rollup.rollup({
    external: [],
    input: "./index.js",
    plugins: [
      commonjs(),
      resolve({ browser: true, preferBuiltins: false }),
      virtual({
        util: 'module.exports = { inspect: { custom: "ass" } };',
        p_r_o_c_e_s_s: `export default ${buildFns()}`,
      }),
      inject({
        process: "p_r_o_c_e_s_s",
      }),
    ],
  });

  const { output } = await bundle.generate({ format: "esm" });

  return output[0].code;
}

const waitEnd = (page) =>
  new Promise((resolve) => {
    page.on("console", (msg) => {
      const text = msg.text();

      if (text === "END") {
        console.log("");
        resolve();
      } else {
        console.log(text);
      }
    });
  });

(async () => {
  const buildPromise = build();

  for (const browserType of ["chromium", "firefox", "webkit"]) {
    const browser = await playwright[browserType].launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const content = await buildPromise;

    page.on("error", (e) => {
      console.error(e);
      browser.close();
    });

    console.log();
    console.log();
    console.log("test ", browserType);

    page.addScriptTag({ content });

    await waitEnd(page);

    await browser.close();
  }
})();
