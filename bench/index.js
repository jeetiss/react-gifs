import benchmark from "nodemark";
import parse from "./code/old";
import fast from "./code/new";

const src = [
  "https://media.giphy.com/media/UuTYaRSoMoJunsjzn7/giphy.gif",
  "https://media.giphy.com/media/eiMUSSymog0lHMwSqQ/giphy.gif",
];

Promise.resolve()
  .then(() => console.log(" "))
  .then(() => console.log("----- old -----"))
  .then(() => fetch(src[0]))
  .then((res) => res.arrayBuffer())
  .then((buffer) =>
    benchmark((callback) => parse(buffer).then(() => callback()))
  )
  .then((result) => console.log(`big: ${result.toString("milliseconds")}`))
  .then(() => fetch(src[1]))
  .then((res) => res.arrayBuffer())
  .then((buffer) =>
    benchmark((callback) => parse(buffer).then(() => callback()))
  )
  .then((result) => console.log(`sml: ${result.toString("milliseconds")}`))
  .then(() => console.log(" "))
  .then(() => console.log("----- new -----"))
  .then(() => fetch(src[0]))
  .then((res) => res.arrayBuffer())
  .then((buffer) =>
    benchmark((callback) => fast(buffer).then(() => callback()))
  )
  .then((result) => console.log(`big: ${result.toString("milliseconds")}`))
  .then(() => fetch(src[1]))
  .then((res) => res.arrayBuffer())
  .then((buffer) =>
    benchmark((callback) => fast(buffer).then(() => callback()))
  )
  .then((result) => console.log(`sml: ${result.toString("milliseconds")}`))
  .then(() => console.log("END"));
