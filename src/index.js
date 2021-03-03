import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useCallback,
} from "react";

import Worker from "worker:./worker";
import { genearate, isOffscreenCanvasSupported } from "./parse-generate";

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

const Canvas = ({ index, frames, width, height }) => {
  const canvasRef = useRef();
  const ctx = useRef();

  useEffect(() => {
    if (canvasRef.current) {
      ctx.current = canvasRef.current.getContext("2d");
    }
  }, [canvasRef]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  }, [canvasRef, width, height]);

  useEffect(() => {
    const currentIndex = index % frames.length;
    ctx.current.drawImage(frames[currentIndex], 0, 0);
  }, [index, frames]);

  return <canvas ref={canvasRef} />;
};

const GifPlayer = ({ src }) => {
  const [info, setInfo] = useState(null);
  const [index, setIndex] = useState(0);
  const [paused, play] = useState(false);

  const worker = useSingleWorker(
    () => new Worker(),
    (worker) => worker.terminate()
  );

  useEffect(() => {
    worker.addEventListener("message", (e) => {
      const message = e.data || e;
      if (message.src === src) {
        if (isOffscreenCanvasSupported) {
          setInfo(message);
        } else {
          genearate(message.frames, message.options).then((info) => {
            setInfo(info);
          });
        }
      }
    });

    worker.postMessage({ src });
  }, [worker, src]);

  const delay = useRef(0);

  useRaf((dt) => {
    const { delays } = info;
    const currentIndex = index % delays.length;

    delay.current += dt;

    if (delay.current > delays[currentIndex]) {
      delay.current = delay.current % delays[currentIndex];
      setIndex(index + 1);
    }
  }, paused || !info);

  return (
    <div>
      <div>
        {info && (
          <Canvas
            index={index}
            frames={info.frames}
            width={info.sizes.width}
            height={info.sizes.height}
          />
        )}
      </div>

      <div>
        <button onClick={() => setIndex((index) => index - 1)}>{"<"}</button>
        <button onClick={() => play((v) => !v)}>play</button>
        <button onClick={() => setIndex((index) => index + 1)}>{">"}</button>

        {info && (
          <input
            type="range"
            value={index % info.frames.length}
            onChange={(e) => setIndex(~~e.target.value)}
            min={0}
            max={info.frames.length - 1}
          />
        )}
      </div>
    </div>
  );
};

export { GifPlayer };
