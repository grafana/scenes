import { arrayToDataFrame, DataTopic, AnnotationQuery, ScopedVars, PanelData } from '@grafana/data';
import { LoadingState } from '@grafana/schema';
import React from 'react';
import { map, Unsubscribable } from 'rxjs';
import { emptyPanelData } from '../../../core/SceneDataNode';
import { sceneGraph } from '../../../core/sceneGraph';
import {
  SceneComponentProps,
  SceneDataLayerProvider,
  SceneDataLayerProviderState,
  SceneTimeRangeLike,
} from '../../../core/types';
import { getDataSource } from '../../../utils/getDataSource';
import { getMessageFromError } from '../../../utils/getMessageFromError';
import { writeSceneLog } from '../../../utils/writeSceneLog';
import { registerQueryWithController } from '../../registerQueryWithController';
import { SceneDataLayerBase } from '../SceneDataLayerBase';
import { DataLayerControlSwitch } from '../SceneDataLayerControls';
import { AnnotationQueryResults, executeAnnotationQuery } from './standardAnnotationQuery';
import { dedupAnnotations, postProcessQueryResult } from './utils';
import { wrapInSafeSerializableSceneObject } from '../../../utils/wrapInSafeSerializableSceneObject';
import { RefreshEvent } from '@grafana/runtime';
import { DrilldownDependenciesManager } from '../../../variables/DrilldownDependenciesManager';

interface AnnotationsDataLayerState extends SceneDataLayerProviderState {
  query: AnnotationQuery;
}

export class AnnotationsDataLayer
  extends SceneDataLayerBase<AnnotationsDataLayerState>
  implements SceneDataLayerProvider
{
  static Component = AnnotationsDataLayerRenderer;

  private _scopedVars: ScopedVars = {
    __sceneObject: wrapInSafeSerializableSceneObject(this),
  };
  private _timeRangeSub: Unsubscribable | undefined;

  private _drilldownDependenciesManager: DrilldownDependenciesManager<AnnotationsDataLayerState> =
    new DrilldownDependenciesManager(this._variableDependency);

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
    this.publishEvent(new RefreshEvent(), true);

    const timeRange = sceneGraph.getTimeRange(this);

    this.setState({
      query: {
        ...this.state.query,
        enable: true,
      },
    });

    this._timeRangeSub = timeRange.subscribeToState(() => {
      this.runWithTimeRange(timeRange);
    });
  }

  public onDisable(): void {
    this.publishEvent(new RefreshEvent(), true);

    this.setState({
      query: {
        ...this.state.query,
        enable: false,
      },
    });

    this._timeRangeSub?.unsubscribe();
  }

  public runLayer() {
    writeSceneLog('AnnotationsDataLayer', 'run layer');
    const timeRange = sceneGraph.getTimeRange(this);
    this.runWithTimeRange(timeRange);
  }

  private async runWithTimeRange(timeRange: SceneTimeRangeLike) {
    const { query } = this.state;

    if (!query.enable) {
      return;
    }

    this._drilldownDependenciesManager.findAndSubscribeToDrilldowns(query.datasource?.uid);

    if (this.querySub) {
      this.querySub.unsubscribe();
    }

    if (this._variableDependency.hasDependencyInLoadingState()) {
      writeSceneLog('AnnotationsDataLayer', 'Variable dependency is in loading state, skipping query execution');
      return;
    }

    try {
      const ds = await this.resolveDataSource(query);

      let stream = executeAnnotationQuery(
        ds,
        timeRange,
        query,
        this,
        this._drilldownDependenciesManager.getFilters(),
        this._drilldownDependenciesManager.getGroupByKeys()
      ).pipe(
        registerQueryWithController({
          type: 'AnnotationsDataLayer/annotationsLoading',
          origin: this,
          cancel: () => this.cancelQuery(),
        }),
        map((events) => {
          const stateUpdate = this.processEvents(query, events);
          return stateUpdate;
        })
      );

      this.querySub = stream.subscribe((stateUpdate) => {
        this.publishResults(stateUpdate);
      });
    } catch (e) {
      this.publishResults({
        ...emptyPanelData,
        state: LoadingState.Error,
        errors: [
          {
            message: getMessageFromError(e),
          },
        ],
      });
      console.error('AnnotationsDataLayer error', e);
    }
  }

  protected async resolveDataSource(query: AnnotationQuery) {
    return await getDataSource(query.datasource || undefined, this._scopedVars);
  }

  protected processEvents(query: AnnotationQuery, events: AnnotationQueryResults): PanelData {
    let processedEvents = postProcessQueryResult(query, events.events || []);
    processedEvents = dedupAnnotations(processedEvents);

    const stateUpdate = { ...emptyPanelData, state: events.state };
    const df = arrayToDataFrame(processedEvents);

    df.meta = {
      ...df.meta,
      dataTopic: DataTopic.Annotations,
    };

    stateUpdate.series = [df];

    return stateUpdate;
  }
}

function AnnotationsDataLayerRenderer({ model }: SceneComponentProps<AnnotationsDataLayer>) {
  const { isHidden } = model.useState();

  if (isHidden) {
    return null;
  }

  return <DataLayerControlSwitch layer={model} />;
}
