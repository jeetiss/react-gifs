import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useReducer,
} from "react";

import Worker from "worker:./worker";
import { genearate, parse, isOffscreenCanvasSupported } from "./parse-generate";

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
        globalRef.worker = undefined;
      }
    };
  }, [globalRef]);

  return globalRef.worker;
};

const useEventCallback = (callback) => {
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  });

  return useCallback((arg) => ref.current && ref.current(arg), []);
};

const useRaf = (callback, pause) => {
  const cb = useEventCallback(callback);

  useEffect(() => {
    if (!pause) {
      let id;
      let prev = null;

      const handleUpdate = () => {
        id = requestAnimationFrame((now) => {
          const dt = now - (prev || now);
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

const calcArgs = (fit, bitmapSize, canvasSize) => {
  switch (fit) {
    case "fill":
      return [
        0,
        0,
        bitmapSize.width,
        bitmapSize.height,
        0,
        0,
        canvasSize.width,
        canvasSize.height,
      ];

    case "contain": {
      const ratio = Math.min(
        canvasSize.width / bitmapSize.width,
        canvasSize.height / bitmapSize.height
      );
      const centerX = (canvasSize.width - bitmapSize.width * ratio) / 2;
      const centerY = (canvasSize.height - bitmapSize.height * ratio) / 2;
      return [
        0,
        0,
        bitmapSize.width,
        bitmapSize.height,
        centerX,
        centerY,
        bitmapSize.width * ratio,
        bitmapSize.height * ratio,
      ];
    }

    case "cover": {
      const ratio = Math.max(
        canvasSize.width / bitmapSize.width,
        canvasSize.height / bitmapSize.height
      );
      const centerX = (canvasSize.width - bitmapSize.width * ratio) / 2;
      const centerY = (canvasSize.height - bitmapSize.height * ratio) / 2;
      return [
        0,
        0,
        bitmapSize.width,
        bitmapSize.height,
        centerX,
        centerY,
        bitmapSize.width * ratio,
        bitmapSize.height * ratio,
      ];
    }

    default:
      return [0, 0];
  }
};

const Canvas = ({ index, frames, width, height, fit }) => {
  const canvasRef = useRef();
  const ctx = useRef();

  useLayoutEffect(() => {
    if (canvasRef.current) {
      ctx.current = canvasRef.current.getContext("2d");
    }
  }, [canvasRef]);

  useLayoutEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  }, [canvasRef, width, height]);

  useEffect(() => {
    if (width && height) {
      ctx.current.clearRect(0, 0, width, height);
    }
  }, [width, height, fit]);

  useEffect(() => {
    const imageBitmap = frames[index];
    if (imageBitmap) {
      ctx.current.drawImage(
        imageBitmap,
        ...calcArgs(fit, imageBitmap, { width, height })
      );
    }
  }, [index, frames, width, height, fit]);

  return <canvas ref={canvasRef} />;
};

const useLoader = (src, callback) => {
  const cb = useEventCallback(callback);

  useEffect(() => {
    if (src) {
      parse(src)
        .then(([frames, options]) => genearate(frames, options))
        .then((info) => cb(info));
    }
  }, [src]);
};

const useWorkerLoader = (src, callback) => {
  const cb = useEventCallback(callback);

  const worker = useSingleWorker(
    () => new Worker(),
    (worker) => worker.terminate()
  );

  useEffect(() => {
    if (src) {
      const handler = (e) => {
        const message = e.data || e;
        if (message.src === src) {
          if (isOffscreenCanvasSupported) {
            cb(message);
          } else {
            genearate(message.frames, message.options).then((info) => cb(info));
          }
        }
      };

      worker.addEventListener("message", handler);
      worker.postMessage({ src });
    }
  }, [worker, src]);
};

// const useMotor = () => {

// };

const initializer = (stateOrFn) => {
  const { playing = true, frames = [], delays = [], index = 0 } =
    (typeof stateOrFn === "function" ? stateOrFn() : stateOrFn) || {};

  return {
    _playing: playing,
    playing: !!(playing && frames && frames.length),
    loaded: !!(frames && frames.length),
    index,
    frames,
    delays,
    length: frames && frames.length,
  };
};

const reducer = (state, action) => {
  switch (action.type) {
    case "load": {
      return {
        ...state,
        playing: state._playing,
        loaded: true,
        frames: action.frames,
        delays: action.delays,
        length: action.frames.length,
        width: action.width,
        height: action.height,
        index: state.index % action.frames.length,
      };
    }
    case "toggle": {
      return {
        ...state,
        _playing: !state._playing,
        playing: !state._playing && state.loaded,
      };
    }
    case "next": {
      return {
        ...state,
        index: (state.index + 1) % state.length,
      };
    }
    case "prev": {
      return {
        ...state,
        index: (state.length + state.index - 1) % state.length,
      };
    }
    case "set": {
      return {
        ...state,
        index: action.index % state.length,
      };
    }
  }
};

const usePlayerState = (stateOrFn) => {
  const [state, dispatch] = useReducer(reducer, stateOrFn, initializer);

  const load = useCallback((data) => dispatch({ type: "load", ...data }), []);
  const toggle = useCallback(() => dispatch({ type: "toggle" }), []);
  const next = useCallback(() => dispatch({ type: "next" }), []);
  const prev = useCallback(() => dispatch({ type: "prev" }), []);
  const set = useCallback((index) => dispatch({ type: "set", index }), []);

  return { state, next, toggle, load, prev, set };
};

const useMotor = (state, updater) => {
  const delay = useRef(0);

  useRaf((dt) => {
    const { delays, index: currentIndex } = state;

    delay.current += dt;

    if (delay.current > delays[currentIndex]) {
      delay.current = delay.current % delays[currentIndex];
      updater();
    }
  }, !state.playing);
};

const GifPlayer = ({ src, width, height, fit = "fill" }) => {
  const { state, next, prev, load, toggle, set } = usePlayerState({
    playing: true,
  });

  useWorkerLoader(src, (info) => {
    load(info);
  });

  useMotor(state, next);

  return (
    <div>
      <div>
        <Canvas
          index={state.index}
          frames={state.frames}
          width={width || state.width}
          height={height || state.height}
          fit={fit}
        />
      </div>

      <div>
        <button onClick={() => prev()}>{"<"}</button>
        <button onClick={() => toggle()}>play</button>
        <button onClick={() => next()}>{">"}</button>

        <input
          type="range"
          value={state.index}
          onChange={(e) => set(~~e.target.value)}
          min={0}
          max={state.length - 1}
        />
      </div>
    </div>
  );
};

export { GifPlayer, useWorkerLoader, useLoader, Canvas, useMotor };
