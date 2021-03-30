import * as React from "react";
import { expectError, expectType } from "tsd";
import {
  usePlayback,
  useParser,
  useWorkerParser,
  usePlayerState,
  Canvas,
} from "..";

// usePlayback tests

usePlayback({ playing: true, index: 1, delays: [] }, () => 0);
const state = { playing: true, loading: 12, index: 1, delays: [] };
usePlayback(state, () => 0);

expectError(usePlayback({ playing: 123 }, () => 0));

// parser tests

useParser("test", (info) => {
  if (!("error" in info)) {
    const { width, height, loaded } = info;
    expectType<number>(width);
    expectType<number>(height);
    expectType<true>(loaded);
  }
});
useParser("str", () => 0);
useParser(false, () => 0);
useParser(undefined, () => 0);

useWorkerParser("str", () => 0);
useWorkerParser(false, () => 0);
useWorkerParser(undefined, () => 0);
useWorkerParser(null, () => 0);

useWorkerParser("str", (info) => {
  if ("error" in info) {
    info.error;
    info.loaded;
  } else {
    info.delays;
    info.frames;
    info.height;
    info.width;
  }

  expectError(info.wrong);
});

// canvas tests

expectType(<Canvas index={0} frames={[]} />);

expectType(<Canvas index={0} frames={[]} fit="cover" />);

expectType(
  <Canvas index={0} frames={[]} style={{ width: 100, height: 100 }} />
);

expectType(<Canvas index={0} frames={[]} width={100} height={300} />);

expectType(<Canvas index={0} frames={[]} className="class" />);

const idFrames = [new ImageData(2, 2)];
expectType(<Canvas index={0} frames={idFrames} className="class" />);

const ibFrames = [new ImageBitmap()];
expectError(<Canvas index={0} frames={ibFrames} className="class" />);

expectError(React.createElement(Canvas, {}));

expectError(<Canvas index={0} frames={[]} fit="unknown" />);

// usePlayerState

expectType(usePlayerState());
expectType(usePlayerState({ autoPlay: true }));
expectType(usePlayerState(() => ({ autoPlay: true })));

expectError(usePlayerState(() => ({ wrong: false })));

const [pstate, update] = usePlayerState();

expectType(update({ playing: false }));
expectType(update(({ playing }) => ({ playing: !playing })));

expectError(update(({ wrong }) => ({ playing: !wrong })));

usePlayback(pstate, () => update({ index: 10 }));

expectError(usePlayback(pstate, update));

expectType(<Canvas {...pstate} />);

const ref = React.createRef<HTMLCanvasElement>();
expectType(<Canvas {...pstate} ref={ref} />);
expectType(
  <Canvas
    {...pstate}
    ref={(ref) => {
      expectType<HTMLCanvasElement | null>(ref);
    }}
  />
);

useWorkerParser("str", update);
useParser("str", update);
