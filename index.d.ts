import { FC, ForwardedRef, CSSProperties } from "react";

type State = {
  width?: number;
  height?: number;

  delays: number[];
  frames: ImageData[];
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

type ParserCallbackArgs =
  | {
      loaded: true;
      width: number;
      height: number;
      delays: number[];
      frames: ImageData[];
    }
  | { loaded: true; error: Error };

type parserCallback = (gifInfo: ParserCallbackArgs) => void;

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
  frames: ImageData[];
  width?: number;
  height?: number;
  ref?: ForwardedRef<HTMLCanvasElement>;
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
