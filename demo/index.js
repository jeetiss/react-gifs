import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./styles.css";
import { GifPlayer } from "..";

const App = () => {
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);
  const [fit, setFit] = useState("cover");

  return (
    <div className="container">
      <div>
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

        <GifPlayer
          src="https://media.giphy.com/media/LG1ZZP1Go0D8j7YsWy/giphy.gif"
          width={width}
          height={height}
          fit={fit}
        />
      </div>

      {/* src="https://media.giphy.com/media/3oz8xTmX0sd5FjqrYc/giphy.gif" */}
      {/* <GifPlayer src="https://media.giphy.com/media/MWSRkVoNaC30A/giphy.gif" />
      <GifPlayer src="https://media.giphy.com/media/LG1ZZP1Go0D8j7YsWy/giphy.gif" />
      <GifPlayer src="https://media.giphy.com/media/nqi89GMgyT3va/giphy.gif" />
      <GifPlayer src="https://media.giphy.com/media/J9O4Frj8gUYHiObBaw/giphy.gif" />
      <GifPlayer src="https://media.giphy.com/media/MB1GpKgQe3azmUBHFi/giphy.gif" />
      <GifPlayer src="https://media.giphy.com/media/MDXomrcGshGso/giphy.gif" />
      <GifPlayer src="https://media.giphy.com/media/lrVf8JVcQA5nR6VsP0/giphy.gif" />
      <GifPlayer src="https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif" />
      <GifPlayer src="https://media.giphy.com/media/MdA16VIoXKKxNE8Stk/giphy.gif" />
      <GifPlayer src="https://media.giphy.com/media/Vd8hid07SWUiXq6J8g/giphy.gif" /> */}
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
