import { parse, genearate, canUseOffscreenCanvas } from "./parse-generate";

const abortMap = new Map();

self.addEventListener("message", (e) => {
  const { type, src } = e.data || e;

  switch (type) {
    case "parse": {
      if (!abortMap.has(src)) {
        const controller = new AbortController();
        const signal = { signal: controller.signal };

        abortMap.set(src, controller);

        parse(src, signal)
          .then(([frames, options]) => {
            if (canUseOffscreenCanvas) {
              return genearate([frames, options], signal);
            } else {
              const result = [];

              for (let i = 0; i < frames.length; ++i) {
                result.push({
                  delay: frames[i].delay,
                  dims: frames[i].dims,
                  disposalType: frames[i].disposalType,
                  patch: frames[i].patch.buffer,
                });
              }

              return { frames: result, options };
            }
          })
          .then((result) => {
            abortMap.delete(src);
            self.postMessage(
              Object.assign(result, { src: src }),
              result.frames.map((frame) => frame.patch || frame)
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
