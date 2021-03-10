import React, { useState, StrictMode } from "react";
import ReactDOM from "react-dom";
import "./styles.css";
import { Canvas, usePlayerState, useWorkerParser, usePlayback } from "..";

const GifPlayer = ({ src, width, height, fit = "fill" }) => {
  const [state, update] = usePlayerState({
    playing: true,
  });

  useWorkerParser(src, (info) => {
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

const Player = () => {
  const [src, setSrc] = useState(
    "https://media.giphy.com/media/LG1ZZP1Go0D8j7YsWy/giphy.gif"
  );
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);
  const [fit, setFit] = useState("cover");

  return (
    <div className="container">
      <div>
        <label style={{ padding: 10 }}>
          src
          <input
            type="text"
            value={src}
            onChange={(e) => setSrc(e.target.value)}
          />
        </label>
        <label style={{ padding: 10 }}>
          width
          <input
            type="number"
            step={10}
            value={width}
            onChange={(e) => setWidth(~~e.target.value)}
          />
        </label>
        <label style={{ padding: 10 }}>
          height
          <input
            type="number"
            step={10}
            value={height}
            onChange={(e) => setHeight(~~e.target.value)}
          />
        </label>
        <label style={{ padding: 10 }}>
          fit
          <select value={fit} onChange={(e) => setFit(e.target.value)}>
            <option>fill</option>
            <option>contain</option>
            <option>cover</option>
          </select>
        </label>

        <GifPlayer src={src} width={width} height={height} fit={fit} />
      </div>
    </div>
  );
};

const App = () => (
  <div>
    <Player />
  </div>
);

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById("root")
);
