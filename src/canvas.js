import React, { useEffect, useLayoutEffect, useRef, forwardRef } from "react";
import { createSingleton } from "./hooks";

const calcArgs = (fit, frameSize, canvasSize) => {
  switch (fit) {
    case "fill":
      return [
        0,
        0,
        frameSize.width,
        frameSize.height,
        0,
        0,
        canvasSize.width,
        canvasSize.height,
      ];

    case "contain": {
      const ratio = Math.min(
        canvasSize.width / frameSize.width,
        canvasSize.height / frameSize.height
      );
      const centerX = (canvasSize.width - frameSize.width * ratio) / 2;
      const centerY = (canvasSize.height - frameSize.height * ratio) / 2;
      return [
        0,
        0,
        frameSize.width,
        frameSize.height,
        centerX,
        centerY,
        frameSize.width * ratio,
        frameSize.height * ratio,
      ];
    }

    case "cover": {
      const ratio = Math.max(
        canvasSize.width / frameSize.width,
        canvasSize.height / frameSize.height
      );
      const centerX = (canvasSize.width - frameSize.width * ratio) / 2;
      const centerY = (canvasSize.height - frameSize.height * ratio) / 2;
      return [
        0,
        0,
        frameSize.width,
        frameSize.height,
        centerX,
        centerY,
        frameSize.width * ratio,
        frameSize.height * ratio,
      ];
    }

    default:
      return [0, 0];
  }
};

const combine = (...refs) => (value) => {
  refs.forEach((ref) => {
    if (typeof ref === "function") {
      ref(value);
    } else if (ref != null) {
      ref.current = value;
    }
  });
};

const useCanvasSingleton = createSingleton(() => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 0;
  canvas.height = 0;

  return ctx;
});

export const Canvas = forwardRef(function Canvas(
  { index, frames, width, height, fit, className, style },
  ref
) {
  const canvasRef = useRef();
  const ctx = useRef();
  const tempCtx = useCanvasSingleton();

  useLayoutEffect(() => {
    if (canvasRef.current) {
      ctx.current = canvasRef.current.getContext("2d");
    }
  }, [canvasRef]);

  useLayoutEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  }, [canvasRef, width, height]);

  useEffect(() => {
    const imageData = frames[index];
    if (imageData) {
      if (
        tempCtx.canvas.width < imageData.width ||
        tempCtx.canvas.height < imageData.height
      ) {
        tempCtx.canvas.width = imageData.width;
        tempCtx.canvas.height = imageData.height;
      }
      if (width > 0 && height > 0) {
        ctx.current.clearRect(0, 0, width, height);
        tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
      }

      tempCtx.putImageData(imageData, 0, 0);
      ctx.current.drawImage(
        tempCtx.canvas,
        ...calcArgs(fit, imageData, { width, height })
      );
    }
  }, [index, frames, width, height, fit]);

  return (
    <canvas ref={combine(canvasRef, ref)} className={className} style={style} />
  );
});
