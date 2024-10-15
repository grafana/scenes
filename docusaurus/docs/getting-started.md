---
id: getting-started
title: Set up Scenes
slug: /
---

This topic describes how to install Scenes and create your first "Hello World" scene.

## Installation

Use the [`@grafana/create-plugin`](https://github.com/grafana/plugin-tools/blob/main/packages/create-plugin/README.md) to start a completely new project.

```bash
npx @grafana/create-plugin@latest
```

Alternatively, add @grafana/scenes to your Grafana app plugin by running the following command in your project:

```bash
yarn add @grafana/scenes
```

## Hello World scene

The following instructions describe how to set up the "Hello World" scene.

### 1. Create a scene

Create your first scene using the snippet below. The following code will create a scene that contains a Grafana Text panel within a flex layout:

```ts
// helloWorldScene.ts

import { EmbeddedScene, SceneFlexLayout, SceneFlexItem, VizPanel, PanelBuilders } from '@grafana/scenes';

export function getScene() {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          width: '50%',
          height: 300,
          body: PanelBuilders.text().setTitle('Panel title').setOption('content', 'Hello world!').build(),
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

:::note
The rendered scene won't be rendered within Grafana plugin page. To integrate scenes with Grafana sidebar, navigation and plugin page follow [Scenes apps](./scene-app.md) guide.
:::

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/getting-started.tsx)
