import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";

import Worker from "./wrapper";
import { usePlayerState } from "./state";
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

const useUpdatedRef = (value) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

const useEventCallback = (callback) => {
  const ref = useUpdatedRef(callback);
  return useCallback((arg) => ref.current && ref.current(arg), []);
};

const useRaf = (callback, pause) => {
  const cb = useEventCallback(callback);

  useLayoutEffect(() => {
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

const Canvas = ({ index, frames, width, height, fit, className, style }) => {
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

  return <canvas ref={canvasRef} className={className} style={style} />;
};

const useAsyncEffect = (fn, deps) => {
  const cb = useEventCallback(fn);

  useEffect(() => {
    const controller = new AbortController();
    const dest = cb(controller);

    return () => {
      controller.abort();
      dest && dest();
    };
  }, [...deps]);
};

const useLoader = (src, callback) => {
  const cb = useEventCallback(callback);

  useAsyncEffect(
    (controller) => {
      if (src) {
        parse(src, { signal: controller.signal })
          .then((raw) => genearate(raw, { signal: controller.signal }))
          .then((info) => cb(info));
      }
    },
    [src]
  );
};

const useWorkerLoader = (src, callback) => {
  const cb = useEventCallback(callback);

  const worker = useSingleWorker(
    () => new Worker(),
    (worker) => worker.terminate()
  );

  useAsyncEffect(
    (controller) => {
      if (src) {
        const handler = (e) => {
          const message = e.data || e;
          if (message.src === src) {
            if (isOffscreenCanvasSupported) {
              cb(message);
            } else {
              genearate([message.frames, message.options], {
                signal: controller.signal,
              }).then((info) => cb(info));
            }
          }
        };

        const abortHandler = () => {
          worker.postMessage({ src, type: "cancel" });
        };

        controller.signal.addEventListener("abort", abortHandler);
        worker.addEventListener("message", handler);
        worker.postMessage({ src, type: "parse" });

        return () => {
          controller.signal.removeEventListener("abort", abortHandler);
          worker.removeEventListener("message", handler);
        };
      }
    },
    [worker, src]
  );
};

const usePlayback = (state, updater) => {
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
  const [state, update] = usePlayerState({
    playing: true,
  });

  useWorkerLoader(src, (info) => {
    update(info);
  });

  usePlayback(state, () => update(({ index }) => ({ index: index + 1 })));

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
        <button onClick={() => update(({ index }) => ({ index: index - 1 }))}>
          {"<"}
        </button>
        <button
          onClick={() => update(({ playing }) => ({ playing: !playing }))}
        >
          play
        </button>
        <button onClick={() => update(({ index }) => ({ index: index + 1 }))}>
          {">"}
        </button>

        <input
          type="range"
          value={state.index}
          onChange={(e) => update({ index: ~~e.target.value })}
          min={0}
          max={state.length - 1}
        />
      </div>
    </div>
  );
};

export {
  GifPlayer,
  useWorkerLoader,
  useLoader,
  Canvas,
  usePlayback,
  usePlayerState,
};
