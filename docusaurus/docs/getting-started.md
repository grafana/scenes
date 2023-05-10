---
id: getting-started
title: Set up Scenes
---

### Installation

Add @grafana/scenes to your Grafana App Plugin by running the following command in your project:

```bash
yarn add @grafana/scenes
```

Or use Scene App template to start from scratch: [Create new Scene App](https://github.com/grafana/scenes-app-template/generate)

## Hello World Scene

### Creating Scene

Create your first Scene using the snippet below. The following code will create a Scene that contains Grafana Text panel within a flex layout.

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

### Rendering Scene

Use the following code in your Grafana App Plugin page to render the Hello World scene:

```tsx
import React from 'react';
import { getScene } from './helloWorldScene';

export const GrafanaAppPluginPage = () => {
  const scene = getScene();

  return <scene.Component model={scene} />;
};
```
