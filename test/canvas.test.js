import "jest-canvas-mock";
import React, { createRef } from "react";
import { render } from "@testing-library/react";
import { Canvas } from "../src/canvas";

const createImageData = (width = 10, height = 10) => {
  let data = new Uint8ClampedArray(width * height * 4);
  for (let i = 3; i < data.length; i += 4) {
    data[i] = 255;
  }
  return new ImageData(data, width, height);
};

const getDraws = (containerORref) => {
  const canvas =
    "current" in containerORref
      ? containerORref.current
      : containerORref.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  return ctx.__getDrawCalls();
};

it("works as expected", () => {
  const ref = createRef();
  const frames = [createImageData(10, 10), createImageData(20, 20)];

  const { rerender } = render(
    <Canvas
      index={0}
      frames={frames}
      ref={ref}
      width={20}
      height={20}
      fit="fill"
    />
  );
  rerender(
    <Canvas
      index={1}
      frames={frames}
      ref={ref}
      width={20}
      height={20}
      fit="fill"
    />
  );

  const calls = getDraws(ref);
  expect(calls).toMatchSnapshot();
});

it("works without ref", async () => {
  const frames = [createImageData(10, 10)];
  const { container } = render(<Canvas index={0} frames={frames} />);

  const draws = getDraws(container);
  expect(draws.length).toEqual(1);
});

it("works with callback ref", async () => {
  const refCallback = jest.fn();
  const frames = [];
  render(<Canvas index={0} frames={frames} ref={refCallback} />);

  expect(refCallback).toHaveBeenCalled();
  expect(refCallback.mock.calls[0][0]).toBeInstanceOf(HTMLCanvasElement);
});
