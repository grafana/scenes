import { arrayToDataFrame, AnnotationEvent, DataTopic, AnnotationQuery, ScopedVars, PanelData } from '@grafana/data';
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
import { AnnotationQueryResults, executeAnnotationQuery } from './standardAnnotationQuery';
import { dedupAnnotations, postProcessQueryResult } from './utils';
import { wrapInSafeSerializableSceneObject } from '../../../utils/wrapInSafeSerializableSceneObject';
import { RefreshEvent } from '@grafana/runtime';
import { DrilldownDependenciesManager } from '../../../variables/DrilldownDependenciesManager';
import { InlineSwitch } from '@grafana/ui';
import { css } from '@emotion/css';

interface AnnotationsDataLayerState extends SceneDataLayerProviderState {
  query: AnnotationQuery;
  /**
   * When enabled, each annotation event is placed in its own DataFrame so that
   * the timeseries panel can render them in separate lanes.
   */
  multiLane?: boolean;
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

    this._drilldownDependenciesManager.findAndSubscribeToDrilldowns(query.datasource?.uid, this);

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

    if (this.state.multiLane) {
      // Group events by their `lane` field so that each distinct lane value becomes
      // one DataFrame. The timeseries panel assigns one visual lane per DataFrame,
      // so this keeps the lane count bounded by the number of distinct lane values
      // rather than the number of individual annotation events.
      //
      // Datasources opt in to multilane by setting a numeric `lane` property on
      // each AnnotationEvent in their processEvents implementation. Events without
      // a `lane` value all fall into lane 0.
      //
      // TODO: `lane` is not yet a typed field on AnnotationEvent in @grafana/data.
      // Once it is added (track at https://github.com/grafana/grafana/issues/XXXX),
      // remove the `as any` casts here and type this properly.
      const byLane = new Map<number, AnnotationEvent[]>();
      for (const evt of processedEvents) {
        const lane: number = (evt as any).lane ?? 0;
        if (!byLane.has(lane)) {
          byLane.set(lane, []);
        }
        byLane.get(lane)!.push(evt);
      }

      stateUpdate.series = Array.from(byLane.values()).map((group) => {
        const df = arrayToDataFrame(group);
        df.meta = {
          ...df.meta,
          dataTopic: DataTopic.Annotations,
        };
        return df;
      });
    } else {
      const df = arrayToDataFrame(processedEvents);
      df.meta = {
        ...df.meta,
        dataTopic: DataTopic.Annotations,
      };
      stateUpdate.series = [df];
    }

    return stateUpdate;
  }
}

function AnnotationsDataLayerRenderer({ model }: SceneComponentProps<AnnotationsDataLayer>) {
  const { isEnabled, isHidden } = model.useState();
  const elementId = `data-layer-${model.state.key}`;

  if (isHidden) {
    return null;
  }

  return (
    <InlineSwitch
      className={switchStyle}
      id={elementId}
      value={isEnabled}
      onChange={() => model.setState({ isEnabled: !isEnabled })}
    />
  );
}

const switchStyle = css({
  borderBottomLeftRadius: 0,
  borderTopLeftRadius: 0,
});
