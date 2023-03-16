import { AbsoluteTimeRange, InterpolateFunction, PanelProps, ScopedVars, toUtc } from '@grafana/data';
import { ErrorBoundaryAlert, PanelChrome } from '@grafana/ui';
import React, { RefCallback, useMemo } from 'react';
import { useMeasure } from 'react-use';
import { CustomFormatterFn } from '../../variables/interpolation/sceneInterpolator';
import { sceneGraph } from '../../core/sceneGraph';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneLayoutChildState, SceneObject } from '../../core/types';
import { getAppEvents } from '@grafana/runtime';

export interface ScenePanelState extends SceneLayoutChildState {
  title: string;
  description?: string;
  displayMode?: 'default' | 'transparent';
  hoverHeader?: boolean;
  component?: React.ComponentType<PanelProps>;
  sceneObject?: SceneObject;
}

export class ScenePanel extends SceneObjectBase<ScenePanelState> {
  static Component = ScenePanelRenderer;

  public onChangeTimeRange = (timeRange: AbsoluteTimeRange) => {
    const sceneTimeRange = sceneGraph.getTimeRange(this);
    sceneTimeRange.onTimeRangeChange({
      raw: {
        from: toUtc(timeRange.from),
        to: toUtc(timeRange.to),
      },
      from: toUtc(timeRange.from),
      to: toUtc(timeRange.to),
    });
  };
}

function ScenePanelRenderer({ model }: SceneComponentProps<ScenePanel>) {
  const {
    title,
    description,
    placement,
    displayMode,
    hoverHeader,
    component: Component,
    sceneObject,
  } = model.useState();
  const [ref, { width, height }] = useMeasure();

  const { data } = sceneGraph.getData(model).useState();
  const parentLayout = sceneGraph.getLayout(model);
  const timeRange = sceneGraph.getTimeRange(model).useState();

  // If parent has enabled dragging and we have not explicitly disabled it then dragging is enabled
  const isDraggable = parentLayout.isDraggable() && (placement?.isDraggable ?? true);
  const dragClass = isDraggable && parentLayout.getDragClass ? parentLayout.getDragClass() : '';
  const dragClassCancel = isDraggable && parentLayout.getDragClassCancel ? parentLayout.getDragClassCancel() : '';

  // Interpolate title
  const titleInterpolated = sceneGraph.interpolate(model, title, undefined, 'text');
  const replaceVariables = useMemo(() => {
    return (text: string, vars?: ScopedVars, format?: string | CustomFormatterFn) =>
      sceneGraph.interpolate(model, text, vars, format);
  }, [model]);

  if (!data) {
    return <div>No data</div>;
  }

  return (
    <div ref={ref as RefCallback<HTMLDivElement>} style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <PanelChrome
        title={titleInterpolated}
        description={description ? () => sceneGraph.interpolate(model, description, undefined, 'text') : ''}
        loadingState={data?.state}
        statusMessage={data?.error ? data.error.message : ''}
        width={width}
        height={height}
        displayMode={displayMode}
        hoverHeader={hoverHeader}
        dragClass={dragClass}
        dragClassCancel={dragClassCancel}
      >
        {(innerWidth, innerHeight) => (
          <>
            <ErrorBoundaryAlert dependencies={[data]}>
              {Component && (
                <Component
                  id={1}
                  data={data!}
                  title={title}
                  timeRange={timeRange.value}
                  timeZone={timeRange.timeZone}
                  options={{}}
                  fieldConfig={{ defaults: {}, overrides: [] }}
                  transparent={false}
                  width={innerWidth}
                  height={innerHeight}
                  renderCounter={0}
                  replaceVariables={replaceVariables as InterpolateFunction}
                  onOptionsChange={() => {}}
                  onFieldConfigChange={() => {}}
                  onChangeTimeRange={model.onChangeTimeRange}
                  eventBus={getAppEvents()}
                />
              )}
              {sceneObject && <sceneObject.Component model={sceneObject} />}
            </ErrorBoundaryAlert>
          </>
        )}
      </PanelChrome>
    </div>
  );
}
