import { AnnotationEvent, arrayToDataFrame, DataTopic, AnnotationQuery } from '@grafana/data';
import { LoadingState } from '@grafana/schema';
import { from, map, merge, mergeAll, mergeMap, reduce, Unsubscribable } from 'rxjs';
import { emptyPanelData } from '../../../core/SceneDataNode';
import { sceneGraph } from '../../../core/sceneGraph';
import { SceneDataLayerProvider, SceneTimeRangeLike, SceneDataLayerProviderState } from '../../../core/types';
import { getDataSource } from '../../../utils/getDataSource';
import { SceneDataLayerBase } from '../SceneDataLayerBase';
import { executeAnnotationQuery } from './standardAnnotationQuery';
import { postProcessQueryResult } from './utils';

interface AnnotationsDataLayerState extends SceneDataLayerProviderState {
  queries: AnnotationQuery[];
}

export class AnnotationsDataLayer
  extends SceneDataLayerBase<AnnotationsDataLayerState>
  implements SceneDataLayerProvider
{
  private _timeRangeSub: Unsubscribable | undefined;
  public topic = DataTopic.Annotations;

  public constructor(initialState: AnnotationsDataLayerState) {
    super({
      isEnabled: true,
      ...initialState,
    });
  }

  public onEnable(): void {
    const timeRange = sceneGraph.getTimeRange(this);

    this._timeRangeSub = timeRange.subscribeToState(() => {
      this.runWithTimeRange(timeRange);
    });

    this.runLayer();
  }

  public onDisable(): void {
    this._timeRangeSub?.unsubscribe();
  }

  public runLayer() {
    const timeRange = sceneGraph.getTimeRange(this);
    this.runWithTimeRange(timeRange);
  }

  private async runWithTimeRange(timeRange: SceneTimeRangeLike) {
    const { queries } = this.state;

    if (this.querySub) {
      this.querySub.unsubscribe();
    }

    this.publishResults({ ...emptyPanelData, state: LoadingState.Loading }, DataTopic.Annotations);

    // Simple path when no queries exist
    if (!queries?.length) {
      this.onDataReceived([]);
    }

    const observables = queries
      // get enabled queries
      .filter((q) => q.enable)
      // execute queries & collect results
      .map((query) => {
        // TODO pass scopedVars
        return from(getDataSource(query.datasource || undefined, {})).pipe(
          mergeMap((ds) => {
            // TODO: There is a lot of AnnotationEvents[] -> DataFrame -> AnnotationEvents[] conversion going on here
            // This needs to be refactored an possibly optimized to use DataFrame only.
            // Seems like this is done to allow mappings to be applied by the data source using processEvents method.
            return executeAnnotationQuery(ds, timeRange, query);
          }),

          map((events) => {
            // Feels like this should be done in annotation processing, not as a separate step.
            return postProcessQueryResult(query, events || []);
          })
        );
      });

    this.querySub = merge(observables)
      .pipe(
        mergeAll(),
        // Combine all annotation results into a single array
        reduce((acc: AnnotationEvent[], value: AnnotationEvent[]) => {
          acc = acc.concat(value);
          return acc;
        })
      )
      .subscribe((result) => {
        this.onDataReceived(result);
      });
  }

  private onDataReceived(result: AnnotationEvent[]) {
    // This is only faking panel data
    const stateUpdate = { ...emptyPanelData };
    const df = arrayToDataFrame(result);
    df.meta = {
      ...df.meta,
      dataTopic: DataTopic.Annotations,
    };

    stateUpdate.annotations = [df];

    this.publishResults(stateUpdate, DataTopic.Annotations);
  }
}
