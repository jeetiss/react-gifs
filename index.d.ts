import { FC, CSSProperties } from "react";

type State = {
  width?: number;
  height?: number;

  delays: number[];
  frames: ImageBitmap[];
  length: number;
  loaded: boolean;

  index: number;

  autoPlay: boolean;
  playing: boolean;
};

declare function usePlayback(
  state: Pick<State, "playing" | "delays" | "index">,
  cb: () => void
): void;

type parserCallback = (
  gifInfo: Pick<State, "delays" | "frames" | "width" | "height">
) => void;

declare function useParser(
  str: string | boolean | undefined | null,
  cb: parserCallback
): void;

declare function useWorkerParser(
  str: string | boolean | undefined | null,
  cb: parserCallback
): void;

declare const Canvas: FC<{
  index: number;
  frames: ImageBitmap[];
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill";
  className?: string;
  style?: CSSProperties;
}>;

type Updates = Partial<State>;

declare function usePlayerState(
  initState?: Updates | (() => Updates)
): [State, (updates: Updates | ((state: State) => Updates)) => void];

export {
  usePlayback,
  useParser,
  useWorkerParser,
  Canvas,
  usePlayerState,
  State,
};
