# react gifs

Set of react tools for GIF rendering

<a href="https://npmjs.org/package/@react-gifs/tools">
  <img alt="npm" src="https://img.shields.io/npm/v/@react-gifs/tools.svg" />
</a>
<a href="https://github.com/jeetiss/react-gifs/actions/workflows/ci.yml">
  <img alt="build" src="https://img.shields.io/github/workflow/status/jeetiss/react-gifs/Run%20Tests%20&%20Linters/main.svg" />
</a>
<a href="https://npmjs.org/package/@react-gifs/tools">
  <img alt="min+zip size" src="https://badgen.net/bundlephobia/minzip/@react-gifs/tools" />
</a>

## Features

- __small__ : Just 4.99 KB gzipped code
- __modular__ : Use hooks and components that you need
- __fast__ : Uses web workers for parsing

## Getting Started

```
npm install @react-gifs/tools
```

```js
import { useWorkerParser, usePlayerState, usePlayback, Canvas } from "@react-gifs/tools";

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
