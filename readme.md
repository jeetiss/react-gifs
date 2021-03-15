# react gifs

Set of react tools for GIFS renering

## Features

- _small_ : Just 4.99 KB gzipped code
- _modular_ : Use hooks and components that you need
- _fast_ : Uses web workers for parsing

## Getting Started

```
npm install @react-gifs/tools
```

```js
import { useWorkerParser, usePlayerState, usePlayback Canvas } from "@react-gifs/tools";

const Gif = (src) => {
  // default state
  const [state, update] = usePlayerState();

  //  load and parse gif
  useWorkerParser(src, update);

  // updates current index
  usePlayback(state, () => update(({ index }) => ({ index: index + 1 })));

  // render frames
  return <Canvas {...state} />;
};
```
