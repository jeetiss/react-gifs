import React, {
  StrictMode,
  useEffect,
  useReducer,
  useRef,
  useMemo,
} from "react";
import ReactDOM from "react-dom";
import { useControls, buttonGroup } from "leva";
import useLocation from "./use-location";

import "./styles.css";

import { Canvas, useWorkerParser, usePlayback } from "..";

const Loader = () => (
  <div style={{ position: "absolute", top: 8, left: 8 }}>
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#007bff"
    >
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)" strokeWidth="2.5px">
          <circle strokeOpacity=".5" cx="12" cy="12" r="10"></circle>
          <path d="M22 12 c 0 -6.5 -5.5 -10 -10 -10">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </g>
    </svg>
  </div>
);

const useEmojiFavicon = (emoji) => {
  const faviconNode = useRef();

  if (!faviconNode.current) {
    faviconNode.current = document.createElement("link");
    faviconNode.current.rel = "shortcut icon";
  }

  useEffect(() => {
    document.head.appendChild(faviconNode.current);
  }, []);

  useEffect(() => {
    const template = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text y=".9em" font-size="90">${emoji}</text>
      </svg>
    `;

    faviconNode.current.href = `data:image/svg+xml,${decodeURI(template)}`;
  }, [emoji]);
};

const setQuery = (key, value) => {
  const search = new URLSearchParams(location.search.slice(1));
  if (search.get(key) === value) return;
  search.set(key, value);

  window.history.pushState(
    null,
    null,
    `${location.origin}${location.pathname}?${search}`
  );
};

const getQuery = (key) => {
  const url = new URLSearchParams(location.search.slice(1));
  return url.get(key);
};

const clamp = (min, value, max) => Math.min(max, Math.max(min, value));

const Player = () => {
  const [search] = useLocation();
  const [state, update] = useReducer((a, b) => ({ ...a, ...b }), {
    loaded: false,
    frames: [],
    length: 1,
  });

  const [{ src, width, height, fit }, setsrc] = useControls(() => ({
    src: {
      value:
        getQuery("gif") ||
        "https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif",
    },

    "": buttonGroup({
      js: () =>
        setsrc({
          src: "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
        }),
      transparency: () =>
        setsrc({
          src: "https://media.giphy.com/media/xUA7b5Cb1muGhlI1fa/giphy.gif",
        }),
      puppy: () =>
        setsrc({
          src: "https://media.giphy.com/media/NujdeXCfWljri/giphy.gif",
        }),
      bts: () =>
        setsrc({
          src: "https://media.giphy.com/media/ZBoHqyxmhv85ff3qOI/giphy.gif",
        }),
    }),

    width: {
      value: clamp(10, 500, window.innerWidth * 0.8),
      step: 10,
      min: 10,
      max: window.innerWidth,
    },

    height: {
      value: clamp(10, 500, window.innerHeight * 0.8),
      step: 10,
      min: 10,
      max: window.innerHeight,
    },

    fit: {
      value: "contain",
      options: ["fill", "contain", "cover"],
    },
  }));

  useEffect(() => {
    setQuery("gif", src);
  }, [src]);

  useEffect(() => {
    const src = getQuery("gif");
    setsrc({ src });
  }, [search]);

  const [{ playing, index, delay }, set] = useControls(
    "state",
    () => ({
      playing: { value: true },
      index: {
        value: 0,
        step: 1,
        min: 0,
        max: state.length - 1,
      },
      delay: {
        value: 60,
        min: 20,
        max: 200,
      },
    }),
    [state.length]
  );

  useEmojiFavicon(playing ? "▶️" : "⏸");

  useEffect(() => {
    if (typeof src === "string") {
      update({ loaded: false });
    }
  }, [src]);

  useWorkerParser(src, (info) => {
    // set initial delay
    update({ loaded: true, frames: info.frames, length: info.frames.length });
    set({
      index: clamp(0, index, info.frames.length - 1),
      delay:
        info.delays.reduce((sum, next) => sum + next, 0) / info.delays.length,
    });
  });

  const delays = useMemo(() => state.frames.map(() => delay), [
    state.frames,
    delay,
  ]);

  usePlayback({ delays, index, playing }, () => {
    set({ index: (index + 1) % state.length });
  });

  return (
    <>
      {!state.loaded && <Loader />}
      <Canvas
        index={index}
        frames={state.frames}
        width={width}
        height={height}
        fit={fit}
      />
    </>
  );
};

ReactDOM.render(
  <StrictMode>
    <Player />
  </StrictMode>,
  document.getElementById("root")
);
