import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useRef
} from "react";

import { parseGIF, decompressFrames } from "gifuct-js";

const gloabalContext = createContext({});

const useSingleWorker = (constructor, destructor) => {
  const globalRef = useContext(gloabalContext);

  if (!globalRef.worker) {
    globalRef.worker = constructor();
  }

  useLayoutEffect(() => {
    globalRef.usageCount = (globalRef.usageCount || 0) + 1;

    return () => {
      globalRef.usageCount = globalRef.usageCount - 1;

      if (globalRef.usageCount === 0) {
        destructor(globalRef.worker);
      }
    };
  }, [globalRef]);

  return globalRef.worker;
};

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

const generateFrames = (frames, gif) => {
  const sizes = gif.lsd;
  const [temp, tempCtx] = createCanvas(sizes);
  const [canvas, ctx] = createCanvas(sizes);

  const framesAsImageData = [];

  let imageData;

  for (let frame of frames) {
    const { width, height, top, left } = frame.dims;
    if (
      !imageData ||
      imageData.width !== width ||
      imageData.height !== height
    ) {
      imageData = new ImageData(width, height);
    }

    imageData.data.set(frame.patch);

    tempCtx.putImageData(imageData, left, top);

    if (frame.disposalType === 2) {
      ctx.clearRect(0, 0, sizes.width, sizes.height);
    }

    ctx.drawImage(temp, 0, 0);

    framesAsImageData.push(ctx.getImageData(0, 0, sizes.width, sizes.height));
  }

  const duration = frames.reduce(
    (duration, frame) => duration + frame.delay,
    0
  );

  const delays = frames.map((frame) => frame.delay);

  return {
    sizes,
    duration,
    delays,
    frames: framesAsImageData
  };
};

const fetchAndParse = (src) => {
  return fetch(src)
    .then((resp) => resp.arrayBuffer())
    .then((buff) => parseGIF(buff))
    .then((gif) => Promise.all([decompressFrames(gif, true), gif]))
    .then(([frames, gif]) => {
      return generateFrames(frames, gif);
    });
};

const GifPlayer = ({ src }) => {
  const canvasRef = useRef();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    (async () => {
      const info = await fetchAndParse(src);

      setInfo(info);
    })();
  }, [src]);

  useEffect(() => {
    if (info && canvasRef.current) {
      const { frames, sizes, delays } = info;

      canvasRef.current.width = sizes.width;
      canvasRef.current.height = sizes.height;

      const ctx = canvasRef.current.getContext("2d");
      let index = 0;
      let id;

      const updateFrame = () => {
        const currentIndex = index % frames.length;
        ctx.putImageData(frames[currentIndex], 0, 0);

        id = setTimeout(() => {
          index++;
          updateFrame();
        }, delays[currentIndex]);
      };

      updateFrame();

      return () => clearTimeout(id);
    }
  }, [canvasRef, info]);

  return (
    <>
      <canvas ref={canvasRef} />
      <br />
      <img src={src} />
    </>
  );
};

export { GifPlayer };
