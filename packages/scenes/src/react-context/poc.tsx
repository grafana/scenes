import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneDataProvider, SceneObjectState } from '../core/types';
import { sceneGraph } from '../core/sceneGraph';
import { PanelData, TimeRange } from '@grafana/data';
import { DataQueryExtended, SceneQueryRunner } from '../querying/SceneQueryRunner';
import { TimeRangePicker } from '@grafana/ui';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { SceneVariable, SceneVariableSetState, SceneVariableState, SceneVariables } from '../variables/types';
import { VariableValueSelectWrapper } from '../variables/components/VariableValueSelectors';

export interface SceneContextValue {
  scene: ReactSceneContextObject;
}

export interface ReactSceneContextObjectState extends SceneObjectState {
  childContext?: ReactSceneContextObject;
  queryRunners: SceneDataProvider[];
}

export class ReactSceneContextObject extends SceneObjectBase<ReactSceneContextObjectState> {}

export const SceneContext = createContext<SceneContextValue>({
  scene: new ReactSceneContextObject({ queryRunners: [] }),
});

export function useTimeRange(): [TimeRange, (timeRange: TimeRange) => void] {
  const { scene } = useContext(SceneContext);
  const sceneTimeRange = sceneGraph.getTimeRange(scene);
  const { value } = sceneTimeRange.useState();

  return [value, sceneTimeRange.onTimeRangeChange];
}

export function useVariables(): SceneVariable[] {
  const { scene } = useContext(SceneContext);
  const variables = sceneGraph.getVariables(scene);
  return variables.useState().variables;
}

export interface SceneContextProviderProps {
  children: React.ReactNode;
  initialState?: Partial<ReactSceneContextObjectState>;
}

/**
 * We could have TimeRangeContextProvider provider and VariableContextProvider as utility components, but the underlying context would be this context
 */
export function SceneContextProvider(props: SceneContextProviderProps) {
  const parentContext = useContext(SceneContext);
  const [isActive, setActive] = useState(false);

  const childScene = useMemo(() => {
    const child = new ReactSceneContextObject({ ...props.initialState, queryRunners: [] });
    parentContext.scene.setState({ childContext: child });
    return child;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentContext.scene]);

  useEffect(() => {
    const fn = childScene.activate();
    setActive(true);
    return fn;
  }, [childScene]);

  // This is to make sure the context scene is active before children is rendered. Important for child SceneQueryRunners
  if (!isActive) {
    return null;
  }

  return <SceneContext.Provider value={{ scene: childScene }}>{props.children}</SceneContext.Provider>;
}

export interface UseQueryOptions {
  queries: DataQueryExtended[];
}

/**
 * Missing a way to detect changes to queries after initial render, but should not be that hard.
 */
export function useSceneQuery(options: UseQueryOptions): PanelData | undefined {
  const { scene } = useContext(SceneContext);

  const queryRunner = useMemo(() => {
    const queryRunner = new SceneQueryRunner({
      queries: options.queries,
    });

    scene.setState({
      queryRunners: [...scene.state.queryRunners, queryRunner],
    });

    return queryRunner;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  useEffect(() => {
    return queryRunner.activate();
  }, [queryRunner]);

  return queryRunner.useState().data;
}

export function SceneControls() {
  const [value, onChangeTimeRange] = useTimeRange();
  const variables = useVariables();

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
      {variables.map((variable) => (
        <VariableValueSelectWrapper key={variable.state.key} variable={variable} />
      ))}
      <TimeRangePicker
        isOnCanvas={true}
        value={value}
        onChange={onChangeTimeRange}
        timeZone={'utc'}
        onMoveBackward={() => {}}
        onMoveForward={() => {}}
        onZoom={() => {}}
        onChangeTimeZone={() => {}}
        onChangeFiscalYearStartMonth={() => {}}
      />
    </div>
  );
}

export function PrintTime() {
  const [time] = useTimeRange();
  return <div>time: {time.raw.from}</div>;
}

export function DataViz(props: { query: string }) {
  const data = useSceneQuery({
    queries: [{ uid: 'gdev-prometheus', refId: 'A', query: props.query }],
  });

  const dataVizRenderCount = useRef(0);
  dataVizRenderCount.current++;

  return (
    <div>
      <div>Render count: {dataVizRenderCount.current}</div>
      <div>Data frames: {data?.series.length}</div>
    </div>
  );
}
