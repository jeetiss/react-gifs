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
import { genearate, parse } from "./parse-generate";

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

const calcArgs = (fit, frameSize, canvasSize) => {
  switch (fit) {
    case "fill":
      return [
        0,
        0,
        frameSize.width,
        frameSize.height,
        0,
        0,
        canvasSize.width,
        canvasSize.height,
      ];

    case "contain": {
      const ratio = Math.min(
        canvasSize.width / frameSize.width,
        canvasSize.height / frameSize.height
      );
      const centerX = (canvasSize.width - frameSize.width * ratio) / 2;
      const centerY = (canvasSize.height - frameSize.height * ratio) / 2;
      return [
        0,
        0,
        frameSize.width,
        frameSize.height,
        centerX,
        centerY,
        frameSize.width * ratio,
        frameSize.height * ratio,
      ];
    }

    case "cover": {
      const ratio = Math.max(
        canvasSize.width / frameSize.width,
        canvasSize.height / frameSize.height
      );
      const centerX = (canvasSize.width - frameSize.width * ratio) / 2;
      const centerY = (canvasSize.height - frameSize.height * ratio) / 2;
      return [
        0,
        0,
        frameSize.width,
        frameSize.height,
        centerX,
        centerY,
        frameSize.width * ratio,
        frameSize.height * ratio,
      ];
    }

    default:
      return [0, 0];
  }
};

const Canvas = ({ index, frames, width, height, fit, className, style }) => {
  const temp = useRef();
  const tempCtx = useRef();
  const canvasRef = useRef();
  const ctx = useRef();

  useLayoutEffect(() => {
    temp.current = document.createElement("canvas");
    tempCtx.current = temp.current.getContext("2d");
  }, []);

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
    const imageData = frames[index];
    if (imageData) {
      if (
        temp.current.width !== imageData.width ||
        temp.current.height !== imageData.height
      ) {
        temp.current.width = imageData.width;
        temp.current.height = imageData.height;
      }

      tempCtx.current.putImageData(imageData, 0, 0);
      ctx.current.drawImage(
        temp.current,
        ...calcArgs(fit, temp.current, { width, height })
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

const useParser = (src, callback) => {
  const cb = useEventCallback(callback);

  useAsyncEffect(
    (controller) => {
      if (typeof src === "string") {
        parse(src, { signal: controller.signal })
          .then((raw) => genearate(raw))
          .then((info) => cb(info));
      }
    },
    [src]
  );
};

const useWorkerParser = (src, callback) => {
  const cb = useEventCallback(callback);

  const worker = useSingleWorker(
    () => new Worker(),
    (worker) => worker.terminate()
  );

  useEffect(() => {
    if (typeof src === "string") {
      const handler = (e) => {
        const message = e.data || e;
        if (message.src === src) {
          cb(genearate(message));
        }
      };

      worker.addEventListener("message", handler);
      worker.postMessage({ src, type: "parse" });

      return () => {
        worker.postMessage({ src, type: "cancel" });
        worker.removeEventListener("message", handler);
      };
    }
  }, [worker, src]);
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

export { useWorkerParser, useParser, Canvas, usePlayback, usePlayerState };
