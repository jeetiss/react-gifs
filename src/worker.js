import { parse } from "./parse-generate";

self.addEventListener("message", (e) => {
  const message = e.data || e;

  parse(message.src).then((args) => {
    self.postMessage(
      { frames: args[0], options: args[1], src: message.src },
      args[0].map((frame) => frame.patch)
    );
  });
});
