import { Button, Icon, Tooltip, useStyles2 } from '@grafana/ui';
import React from 'react';
import { DataFrame, GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { map, Observable } from 'rxjs';
import { SceneComponentProps, SceneObjectState } from '../core/types';
import { sceneGraph } from '../core/sceneGraph';
import { SceneDataTransformer } from '../querying/SceneDataTransformer';
import { VizPanel } from './VizPanel/VizPanel';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';

export interface LimitFramesTitleItemSceneState extends SceneObjectState {
  showAllFrames?: boolean;
  currentFrameCount?: number;
  totalFrameCount?: number
  frameLimit: number
}

/**
 * PanelBuilder titleItems component that will limit the default number of series rendered
 *
 * Usage:
 * PanelBuilders.timeseries()
 * .setData($data)
 * .setTitleItems([new LimitFramesTitleItemScene({
 *    frameLimit: 20, // limits the default number of series that are rendered in the viz
 *  })])
 */
export class LimitFramesTitleItemScene extends SceneObjectBase<LimitFramesTitleItemSceneState> {
  public constructor(state: LimitFramesTitleItemSceneState) {
    super(state);
    this.addActivationHandler(this.onActivate.bind(this));
  }

  private onActivate() {
    const panel = sceneGraph.getAncestor(this, VizPanel);

    const $transformedData = sceneGraph.getData(panel);
    const untransformedQueryRunner = sceneGraph.findDescendent(panel, SceneQueryRunner)

    // Subscribe to data changes and update the series counts
    this._subs.add(
      $transformedData.subscribeToState((transformedDataState) => {
        if (untransformedQueryRunner && untransformedQueryRunner.state.data?.series.length !== this.state.currentFrameCount) {
          this.setState({
            currentFrameCount: transformedDataState.data?.series.length,
            totalFrameCount: untransformedQueryRunner.state.data?.series.length
          });
        }
      })
    );
  }

  /**
   * Removes the default series limit and renders all series in the viz
   */
  public showAllSeries () {
    const $data = sceneGraph.getData(this);
    if($data instanceof SceneDataTransformer){
      $data.setState({
        transformations: [],
      });
      this.setState({
        showAllFrames: true,
      });
      $data.reprocessTransformations();
    }
  }
  public static Component = ({ model }: SceneComponentProps<LimitFramesTitleItemScene>) => {
    const { showAllFrames, currentFrameCount, frameLimit, totalFrameCount,  } = model.useState();
    const styles = useStyles2(getStyles);

    if (
      totalFrameCount === undefined ||
      showAllFrames ||
      !currentFrameCount ||
      totalFrameCount < frameLimit
    ) {
      return null;
    }

    return (
      <div className={styles.timeSeriesDisclaimer}>
        <span className={styles.warningMessage}>
          <>
            <Icon
              title={`Showing only ${model.state.frameLimit} series`}
              name="exclamation-triangle"
              aria-hidden="true"
            />
          </>
        </span>
        <Tooltip content={'Rendering too many series in a single panel may impact performance and make data harder to read.'}>
          <Button variant="secondary" size="sm" onClick={() => model.showAllSeries()}>
            <>Show all {totalFrameCount}</>
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
