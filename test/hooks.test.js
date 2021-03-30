// add polyfills for image data and fetch
import "whatwg-fetch";
import "jest-canvas-mock";

import { renderHook } from "@testing-library/react-hooks";
import { setup } from "./mock-fetch";
import { useParser } from "../src/hooks";

setup();

const renderHookAsync = (callback) =>
  new Promise((resolve) => {
    const result = renderHook(() =>
      callback((val) => resolve({ ...result, result: val }))
    );
  });

it("works with one frame gif", async () => {
  const { result } = await renderHookAsync((done) => useParser("/image", done));

  expect(result.width).toBe(10);
  expect(result.height).toBe(10);
  expect(result.frames.length).toBe(1);
  expect(result.delays.length).toBe(1);
});

it("works with animated gif", async () => {
  const { result } = await renderHookAsync((done) =>
    useParser("/animation", done)
  );

  expect(result.width).toBe(11);
  expect(result.height).toBe(29);
  expect(result.frames.length).toBe(3);
  expect(result.delays.length).toBe(3);
});

it("works fire with error", async () => {
  const { result } = await renderHookAsync((done) => useParser("/error", done));

  expect(result.error.message).toBe('Wrong content type: "image/png"');
});
