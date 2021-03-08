import { reducer, initializer } from "./state";

const defaultState = {
  autoPlay: true,
  delays: [],
  frames: [],
  index: 0,
  length: 0,
  loaded: false,
  playing: false,
};

it("initializer should work", () => {
  expect(initializer()).toStrictEqual(defaultState);
});

it("initializer should work with function", () => {
  expect(initializer(() => ({ playing: false }))).toStrictEqual({
    ...defaultState,
    autoPlay: false,
  });
});

it("reducer should work", () => {
  const initState = {
    ...defaultState,
    autoPlay: false,
    loaded: true,
    length: 3,
    delays: [1, 2, 3],
    frames: [1, 2, 3],
  };
  expect(reducer(initState, { index: 2, playing: true })).toStrictEqual({
    ...initState,
    playing: true,
    index: 2,
  });
});

it("reducer should work with function", () => {
  const initState = {
    ...defaultState,
    autoPlay: false,
    loaded: true,
    length: 3,
    delays: [1, 2, 3],
    frames: [1, 2, 3],
  };
  expect(reducer(initState, () => ({ playing: true }))).toStrictEqual({
    ...initState,
    playing: true,
  });
});

it("reducer allow create toggle function", () => {
  let initState = {
    autoPlay: false,
    playing: false,
    loaded: true,
  };

  const toggle = ({ playing }) => ({ playing: !playing });

  expect(reducer(initState, toggle)).toStrictEqual({
    ...initState,
    playing: true,
  });

  expect(reducer({ ...initState, playing: true }, toggle)).toStrictEqual(
    initState
  );
});
