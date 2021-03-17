import { useReducer } from "react";

const reducer = (state, action = {}) => {
  if (typeof action === "function") {
    action = action(state);
  }

  const isLoadedChange = action.loaded && state.loaded !== action.loaded
  const { playing, ...rest } = action;
  const copy = { ...state, ...rest };

  if (isLoadedChange) {
    Object.assign(copy, {
      playing: copy.autoPlay && copy.loaded,
    });
  }
  
  if (action.delays != null || action.frames != null) {
    Object.assign(copy, {
      length: copy.frames.length,
    });

    if (process.env.NODE_ENV !== "production") {
      if (copy.frames.length !== copy.delays.length)
        throw Error("frames and delays have different sizes");
    }
  }

  if (action.index != null || action.frames != null) {
    Object.assign(copy, {
      index: copy.length === 0 ? 0 : (copy.length + copy.index) % copy.length,
    });
  }

  if (action.playing != null) {
    Object.assign(copy, copy.loaded ? { playing } : { autoPlay: playing });
  }

  return copy;
};

const initializer = (stateOrFn) =>
  reducer(
    {
      autoPlay: true,
      playing: false,
      frames: [],
      delays: [],
      index: 0,
      length: 0,
      loaded: false,
    },
    stateOrFn
  );

const usePlayerState = (stateOrFn) => {
  return useReducer(reducer, stateOrFn, initializer);
};

export { reducer, initializer, usePlayerState };
