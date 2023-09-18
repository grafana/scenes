import { arrayToDataFrame, DataTopic, AnnotationQuery, PanelData } from '@grafana/data';
import { map, Unsubscribable } from 'rxjs';
import { emptyPanelData } from '../../../core/SceneDataNode';
import { sceneGraph } from '../../../core/sceneGraph';
import { SceneDataLayerProvider, SceneTimeRangeLike, SceneDataLayerProviderState } from '../../../core/types';
import { getDataSource } from '../../../utils/getDataSource';
import { SceneDataLayerBase } from '../SceneDataLayerBase';
import { executeAnnotationQuery } from './standardAnnotationQuery';
import { postProcessQueryResult } from './utils';

interface AnnotationsDataLayerState extends SceneDataLayerProviderState {
  query: AnnotationQuery;
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
  }

  public onDisable(): void {
    this._timeRangeSub?.unsubscribe();
  }

  public runLayer() {
    const timeRange = sceneGraph.getTimeRange(this);
    this.runWithTimeRange(timeRange);
  }

  private async runWithTimeRange(timeRange: SceneTimeRangeLike) {
    const { query } = this.state;

    if (this.querySub) {
      this.querySub.unsubscribe();
    }

    try {
      const ds = await getDataSource(query.datasource || undefined, {});

      const queryExecution = executeAnnotationQuery(ds, timeRange, query).pipe(
        map((events) => {
          // Feels like this should be done in annotation processing, not as a separate step.
          const processedEvents = postProcessQueryResult(query, events.events || []);
          const stateUpdate = { ...emptyPanelData, state: events.state };
          const df = arrayToDataFrame(processedEvents);
          df.meta = {
            ...df.meta,
            dataTopic: DataTopic.Annotations,
          };

          return stateUpdate;
        })
      );

      this.querySub = queryExecution.subscribe((stateUpdate) => {
        this.onDataReceived(stateUpdate);
      });
    } catch (e) {
      console.error('AnnotationsDataLayer error', e);
    }
  }

  private onDataReceived(stateUpdate: PanelData) {
    // This is only faking panel data
    this.publishResults(stateUpdate, DataTopic.Annotations);
  }
}
