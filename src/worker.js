import { parse, genearate, canUseOffscreenCanvas } from "./parse-generate";

self.addEventListener("message", (e) => {
  const message = e.data || e;

  parse(message.src)
    .then(([frames, options]) => {
      if (canUseOffscreenCanvas) {
        return genearate(frames, options);
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
      self.postMessage(
        Object.assign(result, { src: message.src }),
        result.frames.map((frame) => frame.patch || frame)
      );
    });
});
