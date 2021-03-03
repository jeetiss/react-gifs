import { parseGIF, decompressFrames } from "gifuct-js";

export const parse = (src) =>
  fetch(src)
    .then((resp) => resp.arrayBuffer())
    .then((buff) => parseGIF(buff))
    .then((gif) =>
      Promise.all([
        decompressFrames(gif, true),
        { width: gif.lsd.width, height: gif.lsd.height },
      ])
    )
    .then(([frames, option]) => {
      const result = [];

      for (let i = 0; i < frames.length; ++i) {
        result.push({
          delay: frames[i].delay,
          dims: frames[i].dims,
          disposalType: frames[i].disposalType,
          patch: frames[i].patch.buffer,
        });
      }

      return [result, option];
    });

const createCanvas = ({ width, height }) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  if (ctx) {
    return [canvas, ctx];
  }

  throw Error("uups");
};

export const genearate = (frames, options, callback) => {
  const [temp, tempCtx] = createCanvas(options);
  const [canvas, ctx] = createCanvas(options);

  const framesAsImageData = [];
  const delays = frames.map((frame) => frame.delay);
  const duration = frames.reduce(
    (duration, frame) => duration + frame.delay,
    0
  );

  let imageData;
  let index = 0;

  const drawNextFrame = () => {
    if (frames.length <= index)
      return callback({
        sizes: options,
        duration,
        delays,
        frames: framesAsImageData,
      });

    const frame = frames[index];
    const { width, height, top, left } = frame.dims;

    if (
      !imageData ||
      imageData.width !== width ||
      imageData.height !== height
    ) {
      imageData = new ImageData(width, height);
    }

    imageData.data.set(new Uint8ClampedArray(frame.patch));

    tempCtx.putImageData(imageData, left, top);

    if (frame.disposalType === 2) {
      ctx.clearRect(0, 0, options.width, options.height);
    }

    ctx.drawImage(temp, 0, 0);

    framesAsImageData.push(
      ctx.getImageData(0, 0, options.width, options.height)
    );

    index++;

    setTimeout(drawNextFrame);
  };

  drawNextFrame();
};
