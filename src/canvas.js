import React, { useEffect, useLayoutEffect, useRef, forwardRef } from "react";

export const calcArgs = (fit, frameSize, canvasSize) => {
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

export const Canvas = forwardRef(function Canvas(
  { index, frames, width, height, fit, className, style },
  ref
) {
  const temp = useRef();
  const tempCtx = useRef();
  const canvasRef = useRef();
  const ctx = useRef();

  useLayoutEffect(() => {
    temp.current = document.createElement("canvas");
    tempCtx.current = temp.current.getContext("2d");
  }, []);

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
        temp.current.width !== imageData.width ||
        temp.current.height !== imageData.height
      ) {
        temp.current.width = imageData.width;
        temp.current.height = imageData.height;
      }
      if (width > 0 && height > 0) {
        ctx.current.clearRect(0, 0, width, height);
      }

      tempCtx.current.putImageData(imageData, 0, 0);
      ctx.current.drawImage(
        temp.current,
        ...calcArgs(fit, temp.current, { width, height })
      );
    }
  }, [index, frames, width, height, fit]);

  return (
    <canvas ref={combine(canvasRef, ref)} className={className} style={style} />
  );
});
