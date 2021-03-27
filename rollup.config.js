import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { string } from "rollup-plugin-string";
import { terser } from "rollup-plugin-terser";

const extensions = [".js", ".json"];
const external = ["react", "gifuct-js"];

const getBabelOptions = (
  targets = ">1%, not dead, not ie 11, not op_mini all"
) => ({
  babelrc: false,
  babelHelpers: "bundled",
  extensions,
  include: ["src/**/*", "**/node_modules/**"],
  exclude: ["src/worker/source.js"],
  presets: [
    ["@babel/preset-env", { loose: true, modules: false, targets }],
    "@babel/preset-react",
  ],
  plugins: ["annotate-pure-calls"],
});

export default [
  // build worker code
  {
    input: "src/worker/worker.js",
    external: [],
    output: {
      format: "esm",
      file: "src/worker/source.js",
      sourcemap: false,
    },
    plugins: [commonjs(), resolve(), terser()],
  },

  // build cjs bundle
  {
    input: "src/index.js",
    external,
    output: {
      format: "cjs",
      file: "dist/index.js",
      sourcemap: false,
    },
    plugins: [
      babel(getBabelOptions()),
      string({ include: "**/worker/source.js" }),
      commonjs(),
      resolve({ extensions }),
    ],
  },

  // build esm bundle
  {
    input: "src/index.js",
    external,
    output: {
      format: "esm",
      file: "dist/index.esm.js",
      sourcemap: false,
    },
    plugins: [
      babel(getBabelOptions()),
      string({ include: "**/worker/source.js" }),
      commonjs(),
      resolve({ extensions }),
    ],
  },
];
