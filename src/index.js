import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useReducer,
  useState,
  useRef,
  useCallback
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

const useEventCallback = (callback) => {
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  });

  return useCallback((arg) => ref.current?.(arg), []);
};

const useRaf = (callback, pause) => {
  const cb = useEventCallback(callback);

  useEffect(() => {
    if (!pause) {
      let id;
      let prev = null;

      const handleUpdate = () => {
        id = requestAnimationFrame((now) => {
          const dt = now - (prev ?? now);
          prev = now;

          cb(dt);
          handleUpdate();
        });
      };

      handleUpdate();

      return () => cancelAnimationFrame(id);
    }
  }, [pause, cb]);
};

const GifPlayer = ({ src }) => {
  const canvasRef = useRef();
  const [info, setInfo] = useState(null);
  const [paused, play] = useState(true);

  useEffect(() => {
    (async () => {
      const info = await fetchAndParse(src);

      setInfo(info);
    })();
  }, [src]);

  useEffect(() => {
    if (info && canvasRef.current) {
      const { sizes } = info;

      canvasRef.current.width = sizes.width;
      canvasRef.current.height = sizes.height;
    }
  }, [canvasRef, info]);

  const ctx = useRef(null);
  const index = useRef(0);
  const delay = useRef(0);
  const renderedFrame = useRef(null);

  useLayoutEffect(() => {
    ctx.current = canvasRef.current.getContext("2d");
  }, []);

  useRaf((dt) => {
    const { frames, delays } = info;
    const currentIndex = index.current % frames.length;

    delay.current += dt;

    if (renderedFrame.current !== currentIndex) {
      ctx.current.putImageData(frames[currentIndex], 0, 0);
    }

    if (delay.current > delays[currentIndex]) {
      delay.current = delay.current % delays[currentIndex];
      index.current += 1;
    }
  }, paused);

  const [key, rerender] = useReducer((v) => !v, 0);

  useEffect(() => {
    if (info) {
      const { frames } = info;
      const currentIndex = index.current % frames.length;
      if (paused) {
        ctx.current.putImageData(frames[currentIndex], 0, 0);
      }
    }
  }, [key, paused, info]);

  return (
    <>
      <div>
        <canvas ref={canvasRef} />
      </div>

      <div>
        <button
          onClick={() => {
            index.current -= 1;
            rerender();
          }}
        >
          {"<"}
        </button>
        <button onClick={() => play((v) => !v)}>play</button>
        <button
          onClick={() => {
            index.current += 1;
            rerender();
          }}
        >
          {">"}
        </button>
      </div>

      <br />

      <img src={src} />
    </>
  );
};

export { GifPlayer };
