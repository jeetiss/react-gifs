import { useEffect, useLayoutEffect, useRef, useCallback } from "react";

import Worker from "./worker";
import { genearate, parse } from "./parse-generate";

const createSingleton = (constructor, destructor) => {
  const ref = {};
  return () => {
    if (!ref.instance) {
      ref.instance = constructor();
    }

    useLayoutEffect(() => {
      if (ref.timeout) {
        clearTimeout(ref.timeout);
        delete ref.timeout;
      } else {
        ref.usageCount = (ref.usageCount || 0) + 1;
      }

      return () => {
        ref.timeout = setTimeout(() => {
          ref.usageCount = ref.usageCount - 1;

          if (ref.usageCount === 0) {
            destructor && destructor(ref.instance);
            delete ref.instance;
            delete ref.timeout;
          }
        });
      };
    }, [ref, destructor]);

    return ref.instance;
  };
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
          .then((info) => cb(info))
          .catch((error) => cb({ error, loaded: true }));
      }
    },
    [src]
  );
};

const useWorkerSingleton = createSingleton(
  () => new Worker(),
  (worker) => worker.terminate()
);

const useWorkerParser = (src, callback) => {
  const cb = useEventCallback(callback);
  const worker = useWorkerSingleton();

  useEffect(() => {
    if (typeof src === "string") {
      const handler = (e) => {
        const message = e.data || e;
        if (message.src === src) {
          const data = message.error ? message : genearate(message);
          cb(data);
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

export { useRaf, createSingleton, useParser, useWorkerParser, usePlayback };
