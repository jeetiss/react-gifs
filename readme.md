# react gifs

Set of react tools for GIFs renering

## Features

- __small__ : Just 4.99 KB gzipped code
- __modular__ : Use hooks and components that you need
- __fast__ : Uses web workers for parsing

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

## Demos

- [gh-pages](https://jeetiss.github.io/react-gifs/)
