import { parse } from "./parse-generate";

const abortMap = new Map();

self.addEventListener("message", (e) => {
  const { type, src } = e.data || e;

  switch (type) {
    case "parse": {
      if (!abortMap.has(src)) {
        const controller = new AbortController();
        const signal = { signal: controller.signal };

        abortMap.set(src, controller);

        parse(src, signal).then((result) => {
          abortMap.delete(src);
          self.postMessage(
            Object.assign(result, { src: src }),
            result.frames.map((frame) => frame.buffer)
          );
        });
      }

      break;
    }

    case "cancel": {
      if (abortMap.has(src)) {
        const controller = abortMap.get(src);
        controller.abort();
        abortMap.delete(src);
      }

      break;
    }
  }
});
