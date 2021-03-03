import React from "react";
import ReactDOM from "react-dom";
import "./styles.css";
import { GifPlayer } from "..";

const App = () => (
  <div className="container">
    <GifPlayer src="https://media.giphy.com/media/MWSRkVoNaC30A/giphy.gif" />
    <GifPlayer src="https://media.giphy.com/media/LG1ZZP1Go0D8j7YsWy/giphy.gif" />
    <GifPlayer src="https://media.giphy.com/media/nqi89GMgyT3va/giphy.gif" />
    <GifPlayer src="https://media.giphy.com/media/J9O4Frj8gUYHiObBaw/giphy.gif" />
    <GifPlayer src="https://media.giphy.com/media/MB1GpKgQe3azmUBHFi/giphy.gif" />
    <GifPlayer src="https://media.giphy.com/media/MDXomrcGshGso/giphy.gif" />
    <GifPlayer src="https://media.giphy.com/media/lrVf8JVcQA5nR6VsP0/giphy.gif" />
    <GifPlayer src="https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif" />
    <GifPlayer src="https://media.giphy.com/media/MdA16VIoXKKxNE8Stk/giphy.gif" />
    <GifPlayer src="https://media.giphy.com/media/Vd8hid07SWUiXq6J8g/giphy.gif" />
  </div>
);

ReactDOM.render(<App />, document.getElementById("root"));
