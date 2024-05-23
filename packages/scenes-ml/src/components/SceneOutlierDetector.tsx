import React from 'react';
import { FieldType, GrafanaTheme2, PanelData, colorManipulator, outerJoinDataFrames } from "@grafana/data";
import { DataTopic, FieldColorModeId } from "@grafana/schema";
import { ButtonGroup, Checkbox, Slider, ToolbarButton, useStyles2 } from "@grafana/ui";
// import { OutlierDetector, DBSCANOptions, MADOptions } from "@grafana-ml/augurs";

import { SceneComponentProps, SceneObjectState, SceneObjectUrlValues, SceneObjectBase, SceneObjectUrlSyncConfig, SceneQueryProcessor } from "@grafana/scenes";
import { css, cx } from '@emotion/css';

interface Outlier {
  series: number;
  start: number;
  end: number;
}

interface SceneOutlierDetectorState extends SceneObjectState {
  epsilon?: number;
  addAnnotations?: boolean;
  onOutlierDetected?: (outlier: Outlier) => void;
}

const DEFAULT_EPSILON = 0.5;

export class SceneOutlierDetector extends SceneObjectBase<SceneOutlierDetectorState>
  implements SceneQueryProcessor<SceneOutlierDetectorState> {

  public static Component = SceneOutlierDetectorRenderer;
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['outlierEpsilon', 'outlierAddAnnotations'] });

  public constructor(state: Partial<SceneOutlierDetectorState>) {
    super(state);
  }

  public onEpsilonChanged(epsilon: number | undefined) {
    this.setState({ epsilon });
  }

  public onAddAnnotationsChanged(addAnnotations: boolean) {
    this.setState({ addAnnotations });
  }

  public getProcessor(): (data: PanelData) => PanelData {
    return ((data) => {
      if (this.state.epsilon === undefined) {
        return data;
      }
      return addOutliers(data, this.state.addAnnotations ?? true, this.state.onOutlierDetected);
    })
  }

  public shouldRerun(prev: SceneOutlierDetectorState, next: SceneOutlierDetectorState): { query: boolean; processor: boolean; } {
    return {
      query: false,
      processor: prev.epsilon !== next.epsilon || prev.addAnnotations !== next.addAnnotations,
    };
  }

  // Get the URL state for the component.
  public getUrlState(): SceneObjectUrlValues {
    return {
      outlierEpsilon: this.state.epsilon?.toString(),
      outlierAddAnnotations: this.state.addAnnotations?.toString(),
    };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    if (!values.outlierEpsilon && !values.outlierAddAnnotations) {
      return;
    }
    let epsilon: number | undefined;
    if (typeof values.outlierEpsilon === 'string') {
      epsilon = parseFloat(values.outlierEpsilon);
    }

    let addAnnotations: boolean | undefined;
    if (typeof values.outlierAddAnnotations === 'string') {
      addAnnotations = values.outlierAddAnnotations === 'true';
    }

    const stateUpdate: Partial<SceneOutlierDetectorState> = {};
    if (epsilon) {
      stateUpdate.epsilon = epsilon;
    } else {
      stateUpdate.epsilon = DEFAULT_EPSILON;
    }
    if (addAnnotations) {
      stateUpdate.addAnnotations = addAnnotations;
    } else {
      stateUpdate.addAnnotations = true;
    }
    this.setState(stateUpdate);
  }
}

// type OutlierTransformerOpts = DBSCANTransformerOpts | MADTransformerOpts;

// interface DBSCANTransformerOpts {
//   algorithm: 'dbscan';
//   // options: DBSCANOptions;
// }

// interface MADTransformerOpts {
//   algorithm: 'mad';
//   // options: MADOptions;
// }

interface OutlierResult {
  outlyingSeries: number[];
  series: OutlierSeries[];
  clusterBand: OutlierBand[];
}

interface OutlierSeries {
  isOutlier: boolean;
  // scores: number[];
  intervals: OutlierInterval[];
}

interface OutlierInterval {
  start: number;
  end: number;
}

interface OutlierBand {
  min: number;
  max: number;
}

function addOutliers(data: PanelData, addAnnotations: boolean, onOutlierDetected?: (outlier: Outlier) => void): PanelData {
  const frames = data.series;
  // Combine all frames into one by joining on time.
  const joined = outerJoinDataFrames({ frames });
  if (joined === undefined) {
    return data;
  }
  // Get number fields: these are our series.
  const serieses = joined.fields.filter(f => f.type === FieldType.number);

  // const detector = new OutlierDetector.dbscan(opts);
  // const outliers = detector.detect(serieses);

  // This is a simple mock outlier detector that marks any value >= 100 as an outlier.
  const outlierSeries = serieses.map((series) => {
    const isOutlier = series.values.find(v => v >= 100) !== undefined;
    const intervals = series.values.reduce((acc, v, i) => {
      if (v >= 100) {
        if (acc.length === 0 || acc[acc.length - 1].end < i) {
          acc.push({ start: i, end: i });
        } else {
          acc[acc.length - 1].end = i;
        }
      }
      return acc;
    }, [] as OutlierInterval[]);
    return {
      isOutlier,
      scores: series.values.map(v => v >= 100 ? 1 : 0),
      intervals,
    };
  });
  const outliers: OutlierResult = {
    outlyingSeries: outlierSeries.map((s, i) => s.isOutlier ? i : -1).filter(i => i !== -1),
    series: outlierSeries,
    clusterBand: Array.from({ length: serieses[0].values.length }, (_, i) => ({
      min: serieses.reduce((min, series) => Math.min(min, series.values[i]), Infinity),
      max: serieses.reduce((max, series) => Math.max(max, series.values[i] > 100 ? max : series.values[i]), -Infinity),
    })),
  };
  if (onOutlierDetected !== undefined) {
    const idx = 0;
    for (const s of outliers.series) {
      for (const i of s.intervals) {
        onOutlierDetected({
          series: idx,
          start: joined.fields[0].values[i.start],
          end: joined.fields[0].values[i.end],
        });
      }
    }
  }

  // increase transparency as the number of series increases, so that the non-outliers are less prominent
  const transparency = 1 / Math.sqrt(1 + (serieses.length ?? 0) / 2);
  const notOutlierColor = colorManipulator.alpha('#FFFFFF', transparency);

  const annotations = [];
  if (addAnnotations) {
    const outlierStartTimes = outliers.series.flatMap((s) => s.intervals.map(interval => joined.fields[0].values[interval.start]));
    const outlierEndTimes = outliers.series.flatMap((s) => s.intervals.map(interval => joined.fields[0].values[interval.end]));
    const outlierAnnotationTexts = outliers.series.flatMap((s, i) => s.intervals.map(_ => `Outlier detected in series ${serieses[i].name}`));
    annotations.push({
      fields: [
        {
          name: 'time',
          type: FieldType.time,
          values: outlierStartTimes,
          config: {},
        },
        {
          name: 'timeEnd',
          type: FieldType.time,
          values: outlierEndTimes,
          config: {},
        },
        {
          name: 'text',
          type: FieldType.string,
          values: outlierAnnotationTexts,
          config: {},
        },
        {
          name: 'isRegion',
          type: FieldType.boolean,
          values: Array(outlierStartTimes.length).fill(true),
          config: {},
        },
      ],
      length: outlierStartTimes.length,
      meta: {
        dataTopic: DataTopic.Annotations,
      },
    });
  }


  // Should return:
  // - The original data with a new label field indicating whether it's an outlier or not
  // - New fields for minimum and maximum bands of the cluster
  return {
    ...data,
    series: [
      {
        ...joined,
        fields: [
          // Always include the time field.
          joined.fields[0],
          ...joined.fields.slice(1).map((f, i) => ({
            ...f,
            config: {
              ...f.config,
              ...(outliers.outlyingSeries.includes(i) ? {
                color: {
                  fixedColor: '#f5b73d',
                  mode: FieldColorModeId.Fixed,
                },
              } : {
                color: {
                  fixedColor: notOutlierColor,
                  mode: FieldColorModeId.Fixed,
                }
              }),
            }
          })),
          {
            name: 'clusterMin',
            type: FieldType.number,
            values: outliers.clusterBand.map(b => b.min),
            config: {
              displayNameFromDS: 'Cluster Min',
              color: {
                fixedColor: 'gray',
                mode: FieldColorModeId.Fixed,
              },
              custom: {
                lineWidth: 0,
                hideFrom: {
                  viz: false,
                  tooltip: false,
                  legend: true,
                }
              },
            }
          },
          {
            name: 'clusterMax',
            type: FieldType.number,
            values: outliers.clusterBand.map(b => b.max),
            config: {
              displayNameFromDS: 'Cluster Max',
              color: {
                fixedColor: 'gray',
                mode: FieldColorModeId.Fixed,
              },
              custom: {
                fillBelowTo: `Cluster Min`,
                lineWidth: 0,
                hideFrom: {
                  viz: false,
                  tooltip: false,
                  legend: true,
                }
              },
            }
          },
        ],
      },
    ],
    annotations,
  };
}

function SceneOutlierDetectorRenderer({ model }: SceneComponentProps<SceneOutlierDetector>) {
  const styles = useStyles2(getStyles);
  const { addAnnotations, epsilon } = model.useState();

  const onClick = () => {
    model.onEpsilonChanged(epsilon === undefined ? DEFAULT_EPSILON : undefined);
  };

  const onChangeEpsilon = (e: number | undefined) => {
    model.onEpsilonChanged(e);
  }

  const sliderStyles = epsilon === undefined ? cx(styles.slider, styles.disabled) : styles.slider;

  return (
    <ButtonGroup>
      <ToolbarButton
        variant="canvas"
        tooltip="Enable outlier detection"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }}
      >
        <Checkbox label=" " value={epsilon !== undefined} onClick={onClick} />
        Outliers
      </ToolbarButton>

      <div className={sliderStyles}>
        <Slider
          onAfterChange={onChangeEpsilon}
          min={0.01}
          max={0.99}
          step={0.01}
          value={epsilon ?? DEFAULT_EPSILON}
        />
      </div>

      <ToolbarButton
        variant="canvas"
        tooltip="Add outlier annotations"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          model.onAddAnnotationsChanged(!(addAnnotations ?? true));
        }}
      >
        <Checkbox
          value={addAnnotations ?? true}
          onChange={() => model.onAddAnnotationsChanged(!(addAnnotations ?? true))}
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
