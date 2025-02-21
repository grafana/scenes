---
id: getting-started
title: Getting started
---

`@grafana/scenes-ml` is a separate npm package which lets you add Machine Learning powered functionality to your scenes.

This topic explains hows to install Scenes ML and use it within a Grafana App plugin.

## Installation

If you're adding Scenes ML to an existing Scenes app plugin, first make sure your plugin config is up-to-date by running:

```bash
npx @grafana/create-plugin@latest --update
```

Then add `@grafana/scenes-ml` to your plugin by running the following commands in your project:

```bash
yarn add @grafana/scenes-ml
```

## Add ML features to a scene

### 1. Create a scene

Create a scene using the snippet below. This will add a time series panel to the scene with built-in controls to add trend, lower and upper bounds to all series in the panel.

```ts
// helloMLScene.ts

import {
  EmbeddedScene,
  SceneFlexLayout,
  SceneFlexItem,
  SceneQueryRunner,
  PanelBuilders,
  sceneUtils,
} from '@grafana/scenes';
import { SceneBaseliner, MLDemoDS } from '@grafana/scenes-ml';

// Register the demo datasource from `scenes-ml`.
// This isn't required for normal usage, it just gives us some sensible demo data.
sceneUtils.registerRuntimeDataSource({ dataSource: new MLDemoDS('ml-test', 'ml-test') });

function getForecastQueryRunner() {
  return new SceneQueryRunner({
    queries: [{ refId: 'A', datasource: { uid: 'ml-test', type: 'ml-test' }, type: 'forecasts' }],
  });
}

export function getScene() {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          width: '50%',
          height: 300,
          body: PanelBuilders.timeseries()
            .setTitle('Forecast demo')
            .setData(getForecastQueryRunner())
            // Add the `SceneBaseliner` to the panel.
            .setHeaderActions([new SceneBaseliner({ interval: 0.95 })])
            .build(),
        }),
      ],
    }),
  });
}
```

### 2. Render the scene

Use the following code in your Grafana app plugin page to render the "Hello ML" scene:

```tsx
import React from 'react';
import { getScene } from './helloMLScene';

export const HelloMLPluginPage = () => {
  const scene = getScene();

  return <scene.Component model={scene} />;
};
```

## Source code

[View the example source code](https://github.com/grafana/scenes/tree/main/docusaurus/docs/scenes-ml/getting-started.tsx)
