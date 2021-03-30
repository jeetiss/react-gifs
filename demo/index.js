import React, {
  StrictMode,
  useEffect,
  useReducer,
  useRef,
  useMemo,
} from "react";
import ReactDOM from "react-dom";
import { useControls, buttonGroup } from "leva";
import toast, { Toaster } from "react-hot-toast";
import useLocation from "./use-location";

import "./styles.css";

import { Canvas, useWorkerParser, usePlayback, usePlayerState } from "..";

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
  const { search } = useLocation();
  const [state, update] = useReducer((a, b) => ({ ...a, ...b }), {
    loaded: false,
    gifDelays: [],
    frames: [],
    length: 1,
  });

  const [{ src }, setsrc] = useControls(() => ({
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
      transparent: () =>
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
  }));

  const { width, height, fit } = useControls("size", {
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
  });

  useEffect(() => {
    setQuery("gif", src);
  }, [src]);

  useEffect(() => {
    const src = getQuery("gif");
    setsrc({ src });
  }, [search]);

  const [{ playing, position: index, speed }, set] = useControls(
    "playback",
    () => ({
      playing: { value: true },
      position: {
        value: 0,
        step: 1,
        min: 0,
        max: state.length - 1,
      },
      speed: {
        value: 1,
        min: 0.1,
        step: 0.01,
        max: 5,
      },

      " ": buttonGroup({
        "0.25x": () => set({ speed: 0.25 }),
        "1.0x": () => set({ speed: 1.0 }),
        "3.0x": () => set({ speed: 3.0 }),
        "5.0x": () => set({ speed: 5.0 }),
      }),
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
    console.log(info);
    if (info.error) {
      update({ loaded: true });
      toast.error(`Can't parse this GIF`);
    } else {
      update({
        loaded: true,
        frames: info.frames,
        length: info.frames.length,
        gifDelays: info.delays,
      });
      set({ position: clamp(0, index, info.frames.length - 1) });
    }
  });

  const delays = useMemo(() => state.gifDelays.map((delay) => delay / speed), [
    state.gifDelays,
    speed,
  ]);

  usePlayback({ delays, index, playing }, () => {
    set({ position: (index + 1) % state.length });
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

const Gif = ({ src }) => {
  const [state, update] = usePlayerState();

  useWorkerParser(src, update);
  usePlayback(state, () => update(({ index }) => ({ index: index + 1 })));

  return <Canvas {...state} />;
};

const Gifs = () => (
  <>
    <Gif src="https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif" />
    <Gif src="https://media.giphy.com/media/xUA7b5Cb1muGhlI1fa/giphy.gif" />
    <Gif src="https://media.giphy.com/media/NujdeXCfWljri/giphy.gif" />
    <Gif src="https://media.giphy.com/media/ZBoHqyxmhv85ff3qOI/giphy.gif" />
  </>
);

const Toggle = () => {
  const [enable, tgl] = useReducer((v) => !v, true);
  const [variant, toggle] = useReducer((v) => !v);

  return (
    <>
      <button onClick={tgl}>enable</button>
      <button onClick={toggle}>toggle</button>
      {enable &&
        (variant ? (
          <Gif src="https://media.giphy.com/media/NujdeXCfWljri/giphy.gif" />
        ) : (
          <Gif src="https://media.giphy.com/media/ZBoHqyxmhv85ff3qOI/giphy.gif" />
        ))}
    </>
  );
};

ReactDOM.render(
  <StrictMode>
    <Player />
    <Toaster
      position="bottom-left"
      toastOptions={{
        className: "e-toast",
      }}
    />
  </StrictMode>,
  document.getElementById("root")
);
