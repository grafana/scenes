import { arrayToDataFrame, DataTopic, AnnotationQuery } from '@grafana/data';
import { LoadingState } from '@grafana/schema';
import { map, Unsubscribable } from 'rxjs';
import { emptyPanelData } from '../../../core/SceneDataNode';
import { sceneGraph } from '../../../core/sceneGraph';
import { SceneDataLayerProvider, SceneTimeRangeLike, SceneDataLayerProviderState } from '../../../core/types';
import { getDataSource } from '../../../utils/getDataSource';
import { getMessageFromError } from '../../../utils/getMessageFromError';
import { writeSceneLog } from '../../../utils/writeSceneLog';
import { SceneDataLayerBase } from '../SceneDataLayerBase';
import { AnnotationQueryResults, executeAnnotationQuery } from './standardAnnotationQuery';
import { dedupAnnotations, postProcessQueryResult } from './utils';

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
    super(
      {
        isEnabled: true,
        ...initialState,
      },
      ['query']
    );
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
    writeSceneLog('AnnotationsDataLayer', 'run layer');
    const timeRange = sceneGraph.getTimeRange(this);
    this.runWithTimeRange(timeRange);
  }

  private async runWithTimeRange(timeRange: SceneTimeRangeLike) {
    const { query } = this.state;

    if (this.querySub) {
      this.querySub.unsubscribe();
    }

    if (sceneGraph.hasVariableDependencyInLoadingState(this)) {
      writeSceneLog('AnnotationsDataLayer', 'Variable dependency is in loading state, skipping query execution');
      this.setState({ _isWaitingForVariables: true });
      return;
    }

    try {
      const ds = await this.resolveDataSource(query);

      const queryExecution = executeAnnotationQuery(ds, timeRange, query, this).pipe(
        map((events) => {
          const stateUpdate = this.processEvents(query, events);
          return stateUpdate;
        })
      );

      this.querySub = queryExecution.subscribe((stateUpdate) => {
        this.publishResults(stateUpdate, DataTopic.Annotations);
      });
    } catch (e) {
      this.publishResults(
        {
          ...emptyPanelData,
          state: LoadingState.Error,
          errors: [
            {
              message: getMessageFromError(e),
            },
          ],
        },
        DataTopic.Annotations
      );
      console.error('AnnotationsDataLayer error', e);
    }
  }

  protected async resolveDataSource(query: AnnotationQuery) {
    return await getDataSource(query.datasource || undefined, {});
  }

  protected processEvents(query: AnnotationQuery, events: AnnotationQueryResults) {
    let processedEvents = postProcessQueryResult(query, events.events || []);
    processedEvents = dedupAnnotations(processedEvents);

    const stateUpdate = { ...emptyPanelData, state: events.state };
    const df = arrayToDataFrame(processedEvents);
    df.meta = {
      ...df.meta,
      dataTopic: DataTopic.Annotations,
    };

    stateUpdate.annotations = [df];

    return stateUpdate;
  }
}
