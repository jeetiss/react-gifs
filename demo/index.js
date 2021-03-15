import React, { StrictMode, useEffect } from "react";
import ReactDOM from "react-dom";
import { useControls } from "leva";
import "./styles.css";


import { Canvas, usePlayerState, useWorkerParser, usePlayback } from "..";

const Player = () => {
  const [state, update] = usePlayerState();

  const { src, width, height, fit } = useControls({
    src: {
      value: "https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif",
    },

    width: {
      value: 500,
      step: 10,
      min: 10,
      max: window.innerWidth,
    },

    height: {
      value: 500,
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
      index: { value: 0, step: 1, min: 0, max: 100 },
      delays: {
        value: 60,
        min: 20,
        max: 200,
      },
    }),
  );

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
