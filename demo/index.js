import React, { StrictMode, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useControls } from "leva";
import "./styles.css";

import { Canvas, usePlayerState, useWorkerParser, usePlayback } from "..";

const useEmojiFavicon = (emoji) => {
  const faviconNode = useRef();

  if (!faviconNode.current) {
    faviconNode.current = document.createElement("link");
    faviconNode.current.rel = "shortcut icon";
  }

  useEffect(() => {
    document.head.appendChild(faviconNode.current);
  }, [])

  useEffect(() => {
    const template = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text y=".9em" font-size="90">${emoji}</text>
      </svg>
    `

    faviconNode.current.href = `data:image/svg+xml,${decodeURI(template)}`
  }, [emoji])
}

const clamp = (min, value, max) => Math.min(max, Math.max(min, value));

const Player = () => {
  const [state, update] = usePlayerState();

  const { src, width, height, fit } = useControls({
    src: {
      value: "https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif",
    },

    width: {
      value: clamp(10, 500, window.innerWidth / 2),
      step: 10,
      min: 10,
      max: window.innerWidth,
    },

    height: {
      value: clamp(10, 500, window.innerHeight / 2),
      step: 10,
      min: 10,
      max: window.innerHeight,
    },

    fit: {
      value: "fill",
      options: ["fill", "contain", "cover"],
    },
  });

  const [{ playing, index, delays }, set] = useControls(
    "state",
    () => ({
      playing: { value: true },
      index: { value: 0, step: 1, min: 0, max: state.length - 1 },
      delays: {
        value: 60,
        min: 20,
        max: 200,
      },
    }),
    [state.length]
  );

  useEmojiFavicon(playing ? '▶️' : '⏸')

  // update playing
  useEffect(() => {
    update({ playing });
  }, [playing]);

  // update index
  useEffect(() => {
    update({ index });
  }, [index]);

  // update delays
  useEffect(() => {
    update(({ frames }) => ({ delays: frames.map(() => delays) }));
  }, [delays]);

  useWorkerParser(src, (info) => {
    // set initial delay
    update({ ...info, delays: info.frames.map(() => delays) });
  });

  usePlayback(state, () => {
    set({ index: (state.index + 1) % state.length });
  });

  return (
    <Canvas
      index={state.index}
      frames={state.frames}
      width={width || state.width}
      height={height || state.height}
      fit={fit}
      style={{ border: "1px solid #e2e2e2" }}
    />
  );
};

ReactDOM.render(
  <StrictMode>
    <Player />
  </StrictMode>,
  document.getElementById("root")
);
