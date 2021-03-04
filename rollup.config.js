import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import worker from "rollup-plugin-web-worker-loader";

const extensions = [".js", ".json"];
const external = ["react", "gifuct-js"];

const getBabelOptions = (
  targets = ">1%, not dead, not ie 11, not op_mini all"
) => ({
  babelrc: false,
  extensions,
  include: ["src/**/*", "**/node_modules/**"],
  presets: [
    ["@babel/preset-env", { loose: true, modules: false, targets }],
    "@babel/preset-react",
  ],
});

export default [
  {
    input: "src/index.js",
    external,
    output: {
      format: "esm",
      file: "dist/index.js",
      sourcemap: false,
    },
    plugins: [
      babel(getBabelOptions()),
      commonjs(),
      resolve({ extensions }),
      worker({
        targetPlatform: "browser",
        pattern: /worker:(.+)/,
        external: [],
      }),
      terser({ compress: { passes: 3 } }),
    ],
  },
];
