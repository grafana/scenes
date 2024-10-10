import { Button, Icon, Tooltip, useStyles2 } from '@grafana/ui';
import React from 'react';
import { DataFrame, GrafanaTheme2, LoadingState } from '@grafana/data';
import { css } from '@emotion/css';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { map, Observable } from 'rxjs';
import { SceneComponentProps, SceneObjectState } from '../core/types';
import { sceneGraph } from '../core/sceneGraph';
import { SceneDataTransformer } from '../querying/SceneDataTransformer';
import { VizPanel } from './VizPanel/VizPanel';

export const MAX_NUMBER_OF_TIME_SERIES = 20;

export interface TimeSeriesLimitSeriesTitleItemSceneState extends SceneObjectState {
  showAllSeries?: boolean;
  currentSeriesCount?: number;
  previousSeriesCount?: number
  seriesLimit: number
}

export class TimeSeriesLimitSeriesTitleItemScene extends SceneObjectBase<TimeSeriesLimitSeriesTitleItemSceneState> {
  public constructor(state: TimeSeriesLimitSeriesTitleItemSceneState) {
    super({
      ...state
    });
    this.addActivationHandler(this.onActivate.bind(this));
  }

  private onActivate() {
    const panel = sceneGraph.getAncestor(this, VizPanel);

    // Clone the data provider
    const $data = panel.state.$data?.clone();

    // Create data transformer
    const transformer = new SceneDataTransformer({
      $data: $data,
      transformations: [() => limitFramesTransformation(this.state.seriesLimit)],
    });

    // Attach data transformer to VizPanel
    panel.setState({
      $data: transformer,
    })

    // Subscribe to data changes and update the series counts
    this._subs.add(
      panel.subscribeToState(() => {
        const $data = sceneGraph.getData(this);

        if ($data.state.data?.series.length !== this.state.currentSeriesCount) {
          this.setState({
            currentSeriesCount: $data.state.data?.series.length,
            previousSeriesCount: $data.state.$data?.state.data?.series.length
          });
        }
      })
    );
  }

  public toggleShowAllSeries () {
    const $data = sceneGraph.getData(this);
    if($data instanceof SceneDataTransformer){
      $data.setState({
        transformations: [],
      });
      this.setState({
        showAllSeries: true,
      });
      $data.reprocessTransformations();
    }
  }
  public static Component = ({ model }: SceneComponentProps<TimeSeriesLimitSeriesTitleItemScene>) => {
    const { showAllSeries, currentSeriesCount, seriesLimit } = model.useState();
    const $data = sceneGraph.getData(model);
    const { data } = $data.useState();
    const styles = useStyles2(getStyles);

    if (
      !($data instanceof SceneDataTransformer) ||
      showAllSeries ||
      data?.state !== LoadingState.Done ||
      !currentSeriesCount ||
      data.series.length < seriesLimit
    ) {
      return null;
    }

    const totalLength = model.state.previousSeriesCount;

    return (
      <div className={styles.timeSeriesDisclaimer}>
        <span className={styles.warningMessage}>
          <>
            <Icon
              title={`Showing only ${model.state.seriesLimit} series`}
              name="exclamation-triangle"
              aria-hidden="true"
            />
          </>
        </span>
        <Tooltip
          content={
            'Rendering too many series in a single panel may impact performance and make data harder to read. Consider adding more filters.'
          }
        >
          <Button variant="secondary" size="sm" onClick={() => model.toggleShowAllSeries()}>
            <>Show all {totalLength}</>
          </Button>
        </Tooltip>
      </div>
    );
  };
}

export function limitFramesTransformation(limit: number) {
  return (source: Observable<DataFrame[]>) => {
    return source.pipe(
      map((frames) => {
        return frames.slice(0, limit);
      })
    );
  };
}


const getStyles = (theme: GrafanaTheme2) => ({
  timeSeriesDisclaimer: css({
    label: 'time-series-disclaimer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  warningMessage: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: theme.colors.warning.main,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});

/**
 * Usage:
 * PanelBuilders.timeseries()
 * .setData($data)
 * .setTitleItems([new TimeSeriesLimitSeriesTitleItemScene({
 *    seriesLimit: 10,
 *  })])
 */
