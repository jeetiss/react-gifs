// add polyfills for image data and fetch 
import "whatwg-fetch";
import "jest-canvas-mock";

import { renderHook } from "@testing-library/react-hooks";
import { setup } from "./mock-fetch";
import { useParser } from "../src/hooks";

setup();

it("works with one frame gif", async () => {
  const result = await new Promise((resolve) => {
    renderHook(() => useParser("/image", (info) => resolve(info)));
  });

  expect(result.width).toBe(10);
  expect(result.height).toBe(10);
  expect(result.frames.length).toBe(1);
  expect(result.delays.length).toBe(1);
});

it("works with animated gif", async () => {
  const result = await new Promise((resolve) => {
    renderHook(() => useParser("/animation", (info) => resolve(info)));
  });

  expect(result.width).toBe(11);
  expect(result.height).toBe(29);
  expect(result.frames.length).toBe(3);
  expect(result.delays.length).toBe(3);
});
