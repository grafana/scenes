---
id: getting-started
title: Set up Scenes
---

This topic describes how to install Scenes and create your first "Hello World" scene.

## Installation

Add @grafana/scenes to your Grafana app plugin by running the following command in your project:

```bash
yarn add @grafana/scenes
```

Alternatively, use the [Scenes app template](https://github.com/grafana/scenes-app-template/generate) to start from scratch.

## Hello World scene

The following instructions describe how to set up the "Hello World" scene.

### 1. Create a scene

Create your first scene using the snippet below. The following code will create a scene that contains a Grafana Text panel within a flex layout:

```ts
// helloWorldScene.ts

import { EmbeddedScene, SceneFlexLayout, SceneFlexItem, VizPanel } from '@grafana/scenes';

export function getScene() {
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

Use the following code in your Grafana app plugin page to render the "Hello World" scene:

```tsx
import React from 'react';
import { getScene } from './helloWorldScene';

export const HelloWorldPluginPage = () => {
  const scene = getScene();

  return <scene.Component model={scene} />;
};
```

:::info
The rendered scene won't be rendered within Grafana plugin page. To integrate scenes with Grafana sidebar, navigation and plugin page follow [Scenes apps](./scene-app.md) guide.
:::
