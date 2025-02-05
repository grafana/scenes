---
id: changepoint-detection
title: Changepoint detection
---

import PinnedSvg from '/static/img/pinned.svg';

**Changepoint detection** attempts to identify timestamps where a time series has changed behaviour. For example, it could be used to identify sudden changes in the **magnitude** or the **variance** of a time series.

The `SceneChangepointDetector` component from `scenes-ml` can be used to add this functionality to all series in a panel. This component will add an annotation at every detected changepoint.

![Panel with changepoints added](/img/changepoints.png)

:::warning
Changepoint detection is currently a beta feature. The underlying algorithm may perform slowly for certain panels, so be sure to test it thoroughly before using it.
:::

## Usage

The code example below demonstrates how to add changepoint detection to a time series panel.

```ts
import { SceneChangepointDetector } from '@grafana/scenes-ml';

// Default values are shown here, all are optional.
const changepointDetector = new SceneChangepointDetector({
  enabled: false,
  pinned: false,
  onChangepointDetected: (changepoint: Changepoint) => {},
});
const panel = PanelBuilders.timeseries().setHeaderActions([outlierDetector]).build();
```

:::note
Make sure you only add changepoint detection to **time series** panels, as it rarely makes sense for other panel types.
:::

### Pinning results

By default, baselines are recalculated on every state change, i.e. whenever the time range, query or interval changes. This isn't always desirable: for example, the user may want to zoom out and view the current forecasts in a future time range.

Enabling the **pinned <PinnedSvg className="ml-icon" />** setting will freeze the current results, so they won't be recalculated as the time range or other settings are changed.

## Technical details

`scenes-ml` currently uses the [AutoRegressive Gaussian Process Change Point detection][argpcp] (ARGPCP) algorithm, which can be slow in some cases. Alternative algorithms may be added in future.

[argpcp]: https://redpoll.ai/blog/changepoint/#autoregressive-gaussian-process-change-point-detector-argpcp
