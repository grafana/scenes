import { ChangepointDetector } from "@bsull/augurs";
import { css, cx } from "@emotion/css";
import { DataFrame, DataQueryRequest, dateTime, FieldType, GrafanaTheme2 } from "@grafana/data";
import { DataTopic } from "@grafana/schema";
import { ButtonGroup, Checkbox, Slider, ToolbarButton, useStyles2 } from "@grafana/ui";
import React from 'react';

import { sceneGraph, SceneComponentProps, SceneObjectState, SceneObjectUrlValues, SceneTimeRangeLike, SceneObjectBase, SceneObjectUrlSyncConfig, ExtraRequest, ProcessorFunc, SceneRequestSupplementer } from "@grafana/scenes";

interface SceneChangepointDetectorState extends SceneObjectState {
  // The hazard function for the changepoint detector.
  // Defaults to 250.0.
  hazard?: number;
  // The look-back factor to use when establishing a baseline.
  // The detector will multiply the range of the data by this factor to determine
  // the amount of data to use as training data. Defaults to 4.0.
  lookbackFactor?: number;
  lookbackFactorOptions: Array<{ label: string; value: number }>;
}

const DEFAULT_HAZARD = 250.0;

export const DEFAULT_LOOKBACK_FACTOR_OPTIONS = [
  { label: '1x', value: 1 },
  { label: '4x', value: 4 },
  { label: '10x', value: 10 },
];

export const DEFAULT_LOOKBACK_FACTOR_OPTION = {
  label: '4x',
  value: 4,
};

export class SceneChangepointDetector extends SceneObjectBase<SceneChangepointDetectorState>
  implements SceneRequestSupplementer<SceneChangepointDetectorState> {

  public static Component = SceneChangepointDetectorRenderer;
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['hazard', 'lookbackFactor'] });

  public constructor(state: Partial<SceneChangepointDetectorState>) {
    super({ lookbackFactorOptions: DEFAULT_LOOKBACK_FACTOR_OPTIONS, ...state });
  }

  // Add secondary requests, used to obtain and transform the training data.
  public getSupplementalRequests(request: DataQueryRequest): ExtraRequest[] {
    const extraRequests: ExtraRequest[] = [];
    if (this.state.hazard) {
      const { to, from: origFrom } = request.range;
      const diffMs = to.diff(origFrom);
      const from = dateTime(to).subtract(this.state.lookbackFactor ?? DEFAULT_LOOKBACK_FACTOR_OPTION.value * diffMs);
      extraRequests.push({
        req: {
          ...request,
          range: {
            from,
            to,
            raw: {
              from,
              to,
            }
          }
        },
        processor: changepointProcessor(this.state, sceneGraph.getTimeRange(this)),
      });
    }
    return extraRequests;
  }

  // Determine if the component should be re-rendered.
  public shouldRerun(prev: SceneChangepointDetectorState, next: SceneChangepointDetectorState): boolean {
    return prev.lookbackFactor !== next.lookbackFactor ||
      prev.hazard !== next.hazard;
  }

  // Get the URL state for the component.
  public getUrlState(): SceneObjectUrlValues {
    return {
      hazard: this.state.hazard?.toString(),
      lookbackFactor: this.state.lookbackFactor?.toString(),
    };
  }

  public onHazardChanged(hazard: number | undefined) {
    this.setState({ hazard });
  }

  public onFactorChanged(lookbackFactor: number) {
    this.setState({ lookbackFactor });
  }

  public onClearFactor() {
    this.setState({ lookbackFactor: undefined });
  }

  // Update the component state from the URL.
  public updateFromUrl(values: SceneObjectUrlValues) {
    if (!values.lookbackFactor && !values.hazard) {
      return;
    }
    let factor: number | undefined;
    if (typeof values.lookbackFactor === 'string') {
      factor = parseInt(values.lookbackFactor, 10);
    } else if (values.lookbackFactor instanceof Array) {
      factor = parseInt(values.lookbackFactor[0], 10);
    }
    let hazard: number | undefined;
    if (typeof values.hazard === 'string') {
      hazard = parseInt(values.hazard, 10);
    } else if (values.hazard instanceof Array) {
      factor = parseInt(values.hazard[0], 10);
    }
    const stateUpdate: Partial<SceneChangepointDetectorState> = {};
    if (factor) {
      const options = DEFAULT_LOOKBACK_FACTOR_OPTIONS;
      if (options.find(({ value }) => value === factor)) {
        stateUpdate.lookbackFactor = factor;
      } else {
        stateUpdate.lookbackFactor = DEFAULT_LOOKBACK_FACTOR_OPTION.value;
      }
    }
    if (hazard) {
      stateUpdate.hazard = hazard;
    } else {
      stateUpdate.hazard = DEFAULT_HAZARD;
    }
    this.setState(stateUpdate);
  }
}

// The transformation function for the changepoint detector.
//
// This function will take the secondary frame returned by the query runner and
// produce a new frame with the changepoint annotations.
const changepointProcessor: (params: SceneChangepointDetectorState, timeRange: SceneTimeRangeLike) => ProcessorFunc = ({ hazard }) => (_, secondary) => {
  const annotations = secondary.series.map((series) => createChangepointAnnotations(series, hazard));
  return { timeRange: secondary.timeRange, series: [], state: secondary.state, annotations };
}

function createChangepointAnnotations(
  frame: DataFrame,
  hazard?: number,
): DataFrame {
  const annotationTimes = [];
  const annotationTexts = [];
  const timeField = frame.fields.find((field) => field.type === FieldType.time);
  if (!timeField) {
    return { fields: [], length: 0 }
  }
  for (const field of frame.fields) {
    if (field.type !== FieldType.number) {
      continue;
    }
    // TODO: Pass through params like hazard to the detector.
    const cpd = ChangepointDetector.example();
    const values = new Float64Array(field.values);
    const cps = cpd.detect_changepoints(values);
    for (const cp of cps.indices) {
      const time = timeField.values[cp + 1];
      annotationTimes.push(time);
      annotationTexts.push('Changepoint detected');
    }
  }
  return {
    fields: [
      {
        name: 'time',
        type: FieldType.time,
        values: annotationTimes,
        config: {},
      },
      {
        name: 'text',
        type: FieldType.string,
        values: annotationTexts,
        config: {},
      }
    ],
    length: annotationTimes.length,
    meta: {
      dataTopic: DataTopic.Annotations,
    }
  };
}

function SceneChangepointDetectorRenderer({ model }: SceneComponentProps<SceneChangepointDetector>) {
  const styles = useStyles2(getStyles);
  const { hazard } = model.useState();

  const onClick = () => {
    model.onHazardChanged(hazard === undefined ? DEFAULT_HAZARD : undefined);
  };

  const onChangeHazard = (i: number | undefined) => {
    model.onHazardChanged(i);
  }

  const sliderStyles = hazard === undefined ? cx(styles.slider, styles.disabled) : styles.slider;

  return (
    <ButtonGroup>
      <ToolbarButton
        variant="canvas"
        tooltip="Enable changepoint detection"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }}
      >
        <Checkbox label=" " value={hazard !== undefined} onClick={onClick} />
        Changepoints
      </ToolbarButton>

      <div className={sliderStyles}>
        <Slider
          onAfterChange={onChangeHazard}
          min={1.0}
          max={500.0}
          step={1}
          value={hazard ?? 250.0}
        />
      </div>
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
