import { reducer, initializer } from "../src/state";

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

it("change of delays or frames doesn't trigger playing state", () => {
  let state = {
    autoPlay: true,
    playing: false,
    loaded: true,
    index: 0,
    length: 1,
    delays: [1],
    frames: [1],
  };

  const update = { delays: [2], frames: [2] };
  expect(reducer(state, update)).toStrictEqual({
    ...state,
    delays: [2],
    frames: [2],
  });
});
