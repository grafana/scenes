---
id: getting-started
title: Set up Scenes
---

### Installation

Add @grafana/scenes to your Grafana App Plugin by running the following command in your project:

```bash
yarn add @grafana/scenes
```

Conversely, use the [Scenes app template](https://github.com/grafana/scenes-app-template/generate) to start from scratch.

## Hello World scene

The following instructions show you how to set up the "Hello World" scene.

### 1. Create a scene

Create your first Scene using the snippet below. The following code will create a scene that contains a Grafana Text panel within a flex layout:

```ts
// helloWorldScene.ts

import { EmbeddedScene, SceneFlexLayout, SceneFlexItem, VizPanel } from '@grafana/scenes';

function getScene() {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          width: '50%',
          height: 300,
          body: new VizPanel({
            title: 'Hello world panel',
            pluginId: 'text',
            options: {
              content: 'Hello world! ',
            },
          }),
        }),
      ],
    }),
  });
}
```

### 2. Render a scene

Use the following code in your Grafana App Plugin page to render the "Hello World" scene:

```tsx
import React from 'react';
import { getScene } from './helloWorldScene';

export const GrafanaAppPluginPage = () => {
  const scene = getScene();

  return <scene.Component model={scene} />;
};
```
