import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";

import Worker from "./wrapper";
import { usePlayerState } from "./state";
import { Canvas } from "./canvas";
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
