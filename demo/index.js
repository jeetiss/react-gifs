import React, { useState, StrictMode } from "react";
import ReactDOM from "react-dom";
import "./styles.css";
import {
  GifPlayer,
  Canvas,
  usePlayerState,
  useWorkerLoader,
  useMotor,
} from "..";

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

const ratio = window.innerWidth / (window.innerHeight);

const width = 200;
const height = width / ratio;

const GIF = ({ src, delay }) => {
  const { state, next, update } = usePlayerState({
    playing: true,
    index: delay,
  });

  useWorkerLoader(src, update);
  useMotor(state, next);

  return (
    <Canvas
      {...state}
      width={width}
      height={height}
      fit="cover"
      className="canvas"
    />
  );
};

let tf = Array.from({ length: 49 }, (_, i) => i);
const src = "https://media.giphy.com/media/HHQl6KZXaSvjq/giphy.gif";

const App = () => (
  <div>
    <Player />

    <div className="header">
      {tf.map((key) => (
        <GIF src={src} key={key} />
      ))}
    </div>
  </div>
);

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById("root")
);
