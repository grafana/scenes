---
id: baselines-and-forecasts
title: Baselines and forecasts
---

import DiscoverSeasonalitiesSvg from '/static/img/discover-seasonalities.svg';
import PinnedSvg from '/static/img/pinned.svg';

**Baselines** provide smoothed estimates of time series data along with lower and upper bounds for the data over time. They can also be used as **forecasts**, using historical data to predict the behaviour of future data.

This functionality can also be used for **anomaly detection** by highlighting timestamps where the true value strayed outside of the lower and upper predicted bounds.

Baselines can be added to panels by using the `SceneBaseliner` component of `scenes-ml`, which will add a control to enable/disable the calculation, adjust the prediction intervals, discover seasonalities, and pin the results.

![Panel with baselines added](/img/baseliner.png)

## Usage

The code example below demonstrates how to add baselines to a time series panel.

```ts
import { SceneBaseliner } from '@grafana/scenes-ml';

// Default values are shown here, all are optional.
const baseliner = new SceneBaseliner({
  interval: 0.95,
  discoverSeasonalities: false,
  pinned: false,
});
const panel = PanelBuilders.timeseries().setHeaderActions([baseliner]).build();
```

:::note
Make sure you only add baselines to **time series** panels, as they rarely make sense for other panel types.
:::

### Pinning results

By default, baselines are recalculated on every state change, i.e. whenever the time range, query or interval changes. This isn't always desirable: for example, the user may want to zoom out and view the current forecasts in a future time range.

Enabling the **pinned <PinnedSvg className="ml-icon" />** setting will freeze the current results, so they won't be recalculated as the time range or other settings are changed.

## Technical details

`scenes-ml` uses the [MSTL][mstl] algorithm to produce in-sample and out-of-sample forecasts. This algorithm decomposes the data into **trend**, **seasonality** and **residuals**, then uses an an [ETS][ets] algorithm to model the trend series.

By default, the algorithm assumes **hourly**, **daily**, **weekly** and **yearly** seasonality (if the data spans at least two of the given season length, i.e. at least two hours for hourly or at least two days for daily).

If the **discover seasonalities <DiscoverSeasonalitiesSvg className="ml-icon"/>** setting is enabled, the baseliner will first attempt to detect any non-standard seasonality in the data using a [periodogram] and account for these seasonalities when modeling the data.

[mstl]: https://arxiv.org/abs/2107.13462
[ets]: https://otexts.com/fpp3/ets-forecasting.html
[periodogram]: https://www.sktime.net/en/latest/api_reference/auto_generated/sktime.param_est.seasonality.SeasonalityPeriodogram.html
