import { css, cx } from "@emotion/css";
import { DataFrame, DataQueryRequest, dateTime, durationToMilliseconds, Field, FieldType, GrafanaTheme2, TimeRange } from "@grafana/data";
import { ets, seasonalities } from "@grafana-ml/augurs";
import { FieldColorModeId } from "@grafana/schema";
import { ButtonGroup, Checkbox, Slider, ToolbarButton, useStyles2 } from "@grafana/ui";
import { Duration } from 'date-fns';
import React from 'react';

import { sceneGraph, SceneComponentProps, SceneObjectState, SceneObjectUrlValues, SceneTimeRangeLike, SceneObjectBase, SceneObjectUrlSyncConfig, ProcessorFunc, SceneRequestSupplementer } from "@grafana/scenes";

interface SceneBaselinerState extends SceneObjectState {
  // The prediction interval to use. Must be between 0 and 1.
  // Defaults to 0.95.
  interval?: number;
  // Whether to discover seasonalities in the data and include them in the model.
  // If true, the model will use the default seasonalities (hourly, daily, weekly, yearly)
  // as well as any seasonalities discovered in the data.
  // If false, the model will only use the default seasonalities.
  // Defaults to false.
  discoverSeasonalities?: boolean;
  // The look-back factor to use when fitting the model.
  // The baseliner will multiply the range of the data by this factor to determine
  // the amount of data to use as training data. Defaults to 4.0.
  trainingLookbackFactor?: number;
  trainingLookbackFactorOptions: Array<{ label: string; value: number }>;
}

// Default to a 95% prediction interval.
const DEFAULT_INTERVAL = 0.95;

// TODO: make this customisable.
export const DEFAULT_TRAINING_FACTOR_OPTIONS = [
  { label: '1x', value: 1 },
  { label: '4x', value: 4 },
  { label: '10x', value: 10 },
];

export const DEFAULT_TRAINING_FACTOR_OPTION = {
  label: '4x',
  value: 4,
};

export class SceneBaseliner extends SceneObjectBase<SceneBaselinerState>
  implements SceneRequestSupplementer<SceneBaselinerState> {

  public static Component = SceneBaselinerRenderer;
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['discoverSeasonalities', 'interval', 'trainingLookbackFactor'] });

  public constructor(state: Partial<SceneBaselinerState>) {
    super({ trainingLookbackFactorOptions: DEFAULT_TRAINING_FACTOR_OPTIONS, ...state });
  }

  // Add secondary requests, used to obtain and transform the training data.
  public getSupplementalRequests(request: DataQueryRequest): DataQueryRequest[] {
    const extraRequests: DataQueryRequest[] = [];
    if (this.state.interval) {
      const { to, from: origFrom } = request.range;
      const diffMs = to.diff(origFrom);
      const from = dateTime(to).subtract(this.state.trainingLookbackFactor ?? DEFAULT_TRAINING_FACTOR_OPTION.value * diffMs);
      extraRequests.push({
        ...request,
        range: {
          from,
          to,
          raw: {
            from,
            to,
          }
        },
      });
    }
    return extraRequests;
  }

  public getProcessor(): ProcessorFunc {
    return baselineProcessor(this.state, sceneGraph.getTimeRange(this));
  }

  // Determine if the component should be re-rendered.
  public shouldRerun(prev: SceneBaselinerState, next: SceneBaselinerState): { processor: boolean; query: boolean; } {
    const wasEnabled = prev.interval !== undefined;
    const nowEnabled = next.interval !== undefined;
    return {
      query: wasEnabled !== nowEnabled,
      processor: prev.trainingLookbackFactor !== next.trainingLookbackFactor ||
        prev.interval !== next.interval ||
        prev.discoverSeasonalities !== next.discoverSeasonalities,
    };
  }

  // Get the URL state for the component.
  public getUrlState(): SceneObjectUrlValues {
    return {
      interval: this.state.interval?.toString(),
      discoverSeasonalities: this.state.discoverSeasonalities?.toString(),
      trainingLookbackFactor: this.state.trainingLookbackFactor?.toString(),
    };
  }

  public onIntervalChanged(interval: number | undefined) {
    this.setState({ interval });
  }

  public onDiscoverSeasonalitiesChanged(discoverSeasonalities: boolean) {
    this.setState({ discoverSeasonalities });
  }

  public onFactorChanged(trainingLookbackFactor: number) {
    this.setState({ trainingLookbackFactor });
  }

  public onClearFactor() {
    this.setState({ trainingLookbackFactor: undefined });
  }

  // Update the component state from the URL.
  public updateFromUrl(values: SceneObjectUrlValues) {
    if (!values.trainingLookbackFactor && !values.interval) {
      return;
    }
    let factor: number | undefined;
    if (typeof values.trainingLookbackFactor === 'string') {
      factor = parseInt(values.trainingLookbackFactor, 10);
    } else if (values.trainingLookbackFactor instanceof Array) {
      factor = parseInt(values.trainingLookbackFactor[0], 10);
    }
    let interval: number | undefined;
    if (typeof values.interval === 'string') {
      interval = parseInt(values.interval, 10);
    } else if (values.interval instanceof Array) {
      interval = parseInt(values.interval[0], 10);
    }
    let discoverSeasonalities: boolean | undefined;
    if (typeof values.discoverSeasonalities === 'string') {
      discoverSeasonalities = values.discoverSeasonalities === 'true';
    } else if (values.discoverSeasonalities instanceof Array) {
      discoverSeasonalities = values.discoverSeasonalities[0] === 'true';
    }
    const stateUpdate: Partial<SceneBaselinerState> = {};
    if (factor) {
      const options = DEFAULT_TRAINING_FACTOR_OPTIONS;
      if (options.find(({ value }) => value === factor)) {
        stateUpdate.trainingLookbackFactor = factor;
      } else {
        stateUpdate.trainingLookbackFactor = DEFAULT_TRAINING_FACTOR_OPTION.value;
      }
    }
    if (interval) {
      stateUpdate.interval = interval;
    } else {
      stateUpdate.interval = DEFAULT_INTERVAL;
    }
    if (discoverSeasonalities) {
      stateUpdate.discoverSeasonalities = discoverSeasonalities;
    } else {
      stateUpdate.discoverSeasonalities = false;
    }
    this.setState(stateUpdate);
  }
}

// The transformation function for the baseliner.
//
// This function will take the secondary frame returned by the query runner and
// produce a new frame with the baselines added.
const baselineProcessor: (params: SceneBaselinerState, timeRange: SceneTimeRangeLike) => ProcessorFunc = ({ interval, discoverSeasonalities }, timeRange) => (_, secondary) => {
  const baselines = secondary.series.map((series) => {
    const baselineFrame = createBaselinesForFrame(series, interval, undefined, discoverSeasonalities, timeRange.state.value);
    return {
      ...series,
      meta: {
        ...series.meta,
        baseline: {
          isBaselineTrainingQuery: true,
          origRefId: series.refId,
        },
      },
      refId: `${series.refId}-baseline-training`,
      fields: baselineFrame.fields,
    };
  });
  return { ...secondary, series: baselines };
}

// Seasonalities added by default.
const defaultSeasonalities = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};
const defaultSeasonalitiesArray = Object.values(defaultSeasonalities);

// Determine if the given frame can have a baseline added to it.
//
// A frame can have a baseline added to it if:
// - It has at least two fields.
// - The first field has at least 10 values.
// - It has a time field.
// - It has a number field.
//
// If these conditions are met, the function will return an object with the indices of the number and time fields.
// If not, it will return false.
function canAddBaseline(frame: DataFrame): false | { numFieldIdx: number; timeFieldIdx: number } {
  const timeFieldIdx = frame.fields.findIndex((field) => field.type === FieldType.time);
  const numFieldIdx = frame.fields.findIndex((field) => field.type === FieldType.number);
  if (frame.fields.length < 2 || frame.fields[0].values.length < 10 || timeFieldIdx === -1 || numFieldIdx === -1) {
    return false;
  }
  return { numFieldIdx, timeFieldIdx };
}

// Determine the season length for each possible seasonality.
//
// For example, if the data has frequency 5 minutes and exhibits
// hourly, daily and weekly seasonality, then the season lengths
// are [12, 288, 2016].
//
// Seasonalities which are greater than half the range of the data
// are not considered, since the data does not contain enough
// cycles of the seasonality to learn from. For example, if the data
// has a range of 36 hours, then daily seasonality is not considered
// (and neither are weekly or yearly seasonality).
function determineSeasonLengths(range: number, freq: number, extraSeasonalities?: Duration[]): number[] {
  const extraSeasonalitiesArray = (extraSeasonalities ?? []).map((d) => durationToMilliseconds(d));
  return defaultSeasonalitiesArray
    .concat(extraSeasonalitiesArray)
    .filter((seasonality) => seasonality < range / 2)
    .map((seasonality) => Math.floor(seasonality / freq))
    .filter((length) => length > 1);
}

// Create an array of `n` values representing timestamps, starting at
// `initial` and incrementing by `freq`,
function createTimes(n: number, freq: number, initial: number): number[] {
  return Array.from({ length: n }, (_, i) => i * freq + initial);
}

// The options for the Augurs prediction transformation.
export interface AugursPredictionTransformationOptions {
  // The prediction interval to use. Must be between 0 and 1.
  // If not provided, no intervals will be calculated.
  interval?: number;
  // The time range to predict over. If not provided, the predictions
  // will be in-sample only.
  timeRange?: TimeRange;
  // Extra seasonalities to use when fitting the model.
  //
  // The transformation will use the default seasonalities (hourly, daily, weekly, yearly)
  // as well as any extra seasonalities provided here.
  extraSeasonalities?: Duration[];
  // The look-back factor to use when fitting the model.
  // The transformation will fetch the last `lookBackFactor` data points
  // to use as training data. The default is 4.0.
  // Currently not used.
  lookBackFactor?: number;
}

function createBaselinesForFrame(
  frame: DataFrame,
  interval?: number,
  extraSeasonalities?: Duration[],
  discoverSeasonalities = false,
  timeRange?: TimeRange,
): DataFrame {
  const canAdd = canAddBaseline(frame);
  if (!canAdd) {
    return frame;
  }

  const numField = frame.fields[canAdd.numFieldIdx];
  const timeField = frame.fields[canAdd.timeFieldIdx];

  // Figure out the range and frequency of the data.
  const inSampleRange = timeField.values.at(-1) - timeField.values.at(0);
  const freq = timeField.values.at(1) - timeField.values.at(0);

  // Convert the data to a Float64Array so it can be sent to the model.
  const y = new Float64Array(numField.values);

  const extraSeasonLengths = discoverSeasonalities ? Array.from(seasonalities(y)) : [];
  const seasonLengths = new Uint32Array([
    ...determineSeasonLengths(inSampleRange, freq, extraSeasonalities),
    ...extraSeasonLengths,
  ]);

  // We can only do seasonal predictions for now :/
  // Realistically that means we either need our data range to be > 2h or
  // we need to have a detected seasonal pattern in the data.
  if (seasonLengths.length === 0) {
    return frame;
  }

  // Create and fit the model.
  const model = ets(seasonLengths, { impute: true });
  model.fit(y);

  // Get predictions for in-sample data (i.e. the same data we trained on).
  const inSample = model.predict_in_sample(interval);
  let values = Array.from(inSample.point);
  let lower = inSample.intervals ? Array.from(inSample.intervals.lower) : undefined;
  let upper = inSample.intervals ? Array.from(inSample.intervals.upper) : undefined;

  // Create an output time field with the right number of entries.
  let totalSteps = inSampleRange / freq + 1;
  let times = createTimes(totalSteps, freq, timeField.values.at(0));

  // If we've been given a time range, we can filter our in-sample
  // predictions to only include data within that range. If the range
  // extends beyond the end of the data, we can also add out-of-sample
  // predictions.
  if (timeRange !== undefined) {
    const { from, to } = timeRange;
    // Find the indexes of the first and last times in our times array that we should keep.
    const fromIdx = times.findIndex((t) => t >= from.valueOf());
    let toIdx = times.findIndex((t) => t >= to.valueOf());
    if (toIdx === -1) {
      toIdx = times.length;
    }
    const inSampleSteps = toIdx - fromIdx;

    // The final number of steps will now be the difference between to and from, divided by the
    // frequency of the data. Add one to account because the range is inclusive.
    totalSteps = (to.valueOf() - from.valueOf()) / freq + 1;
    const outOfSampleSteps = totalSteps - inSampleSteps;

    // Slice the in-sample data to only include the data we want.
    times = times.slice(fromIdx, toIdx);
    values = values.slice(fromIdx, toIdx);
    lower = lower ? lower.slice(fromIdx, toIdx) : undefined;
    upper = upper ? upper.slice(fromIdx, toIdx) : undefined;

    // Add out-of-sample predictions.
    if (outOfSampleSteps > 0) {
      const outOfSample = model.predict(outOfSampleSteps, interval);
      // Recreate the times array since we're going to have data for the
      // full time range now.
      times = createTimes(totalSteps, freq, times[0]);
      values = values.concat(Array.from(outOfSample.point));
      if (lower && upper && outOfSample.intervals) {
        lower = lower.concat(Array.from(outOfSample.intervals.lower));
        upper = upper.concat(Array.from(outOfSample.intervals.upper));
      }
    }
  }

  const name = numField.config.displayNameFromDS ?? frame.name ?? numField.name;
  const fields = createFields(name, timeField, times, values, lower, upper);
  return { fields, length: times.length };
}

// Create new fields from baseline values.
// The fields will have names derived from the original field, and
// configurations to ensure they are displayed correctly in the graph.
function createFields(name: string, timeField: Field, times: number[], point: number[], lower?: number[], upper?: number[]) {
  // Always add the point estimates, but only add the intervals if they exist.
  const fields: Field[] = [
    // Recreate the time field with the new times.
    {
      ...timeField,
      values: times,
    },
    {
      name: `${name} - baseline`,
      type: FieldType.number,
      values: point,
      config: {
        displayNameFromDS: `${name} - baseline`,
        color: {
          fixedColor: 'blue',
          mode: FieldColorModeId.Fixed,
        },
      },
    },
  ];
  if (lower && upper) {
    fields.push({
      name: `${name} - lower`,
      type: FieldType.number,
      values: lower,
      config: {
        displayNameFromDS: `${name} - lower`,
        color: {
          fixedColor: 'blue',
          mode: FieldColorModeId.Fixed,
        },
        custom: {
          lineWidth: 1,
          hideFrom: {
            viz: false,
            tooltip: false,
            legend: true,
          },
        }
      },
    });
    fields.push({
      name: `${name} - upper`,
      type: FieldType.number,
      values: upper,
      config: {
        displayNameFromDS: `${name} - upper`,
        color: {
          fixedColor: 'blue',
          mode: FieldColorModeId.Fixed,
        },
        custom: {
          fillBelowTo: `${name} - lower`,
          lineWidth: 1,
          hideFrom: {
            viz: false,
            tooltip: false,
            legend: true,
          },
        }
      },
    });
  }
  return fields;
}

function SceneBaselinerRenderer({ model }: SceneComponentProps<SceneBaseliner>) {
  const styles = useStyles2(getStyles);
  const { discoverSeasonalities, interval } = model.useState();

  const onClick = () => {
    model.onIntervalChanged(interval === undefined ? DEFAULT_INTERVAL : undefined);
  };

  const onChangeInterval = (i: number | undefined) => {
    model.onIntervalChanged(i);
  }

  const sliderStyles = interval === undefined ? cx(styles.slider, styles.disabled) : styles.slider;

  return (
    <ButtonGroup>
      <ToolbarButton
        variant="canvas"
        tooltip="Enable baselining"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }}
      >
        <Checkbox label=" " value={interval !== undefined} onClick={onClick} />
        Baseline
      </ToolbarButton>

      <div className={sliderStyles}>
        <Slider
          onAfterChange={onChangeInterval}
          min={0.01}
          max={0.99}
          step={0.01}
          value={interval ?? 0.95}
        />
      </div>

      <ToolbarButton
        variant="canvas"
        tooltip="Discover seasonalities"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          model.onDiscoverSeasonalitiesChanged(!discoverSeasonalities);
        }}
      >
        <Checkbox
          value={discoverSeasonalities}
          onChange={() => model.onDiscoverSeasonalitiesChanged(!discoverSeasonalities)}
        />
      </ToolbarButton>
    </ButtonGroup>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    disabled: css`
      & > div {
        opacity: 0.2;
      }
    `,
    slider: css`
      display: flex;
      width: 120px;
      align-items: center;
      border: 1px solid ${theme.colors.secondary.border};
      & > div {
        .rc-slider {
          margin: auto 16px;
        }
        .rc-slider + div {
          display: none;
        }
      }
    `,
  }
};
