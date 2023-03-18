import React, { useEffect } from 'react';

import { SceneComponentCustomWrapper, SceneComponentProps, SceneObject } from './types';

function SceneComponentWrapperWithoutMemo<T extends SceneObject>({ model, ...otherProps }: SceneComponentProps<T>) {
  const Component = (model as any).constructor['Component'] ?? EmptyRenderer;
  const inner = <Component {...otherProps} model={model} />;
  const CustomWrapper = getComponentWrapper(model);

  // Handle component activation state state
  useEffect(() => {
    if (!model.isActive) {
      model.activate();
    }
    return () => {
      if (model.isActive) {
        model.deactivate();
      }
    };
  }, [model]);

  if (CustomWrapper) {
    return <CustomWrapper model={model}>{inner}</CustomWrapper>;
  }

  return inner;
}

export const SceneComponentWrapper = React.memo(SceneComponentWrapperWithoutMemo);

function EmptyRenderer<T>(_: SceneComponentProps<T>): React.ReactElement | null {
  return null;
}

function getComponentWrapper(sceneObject: SceneObject): SceneComponentCustomWrapper | undefined {
  if (sceneObject.componentWrapper) {
    return sceneObject.componentWrapper;
  }

  if (sceneObject.parent) {
    return getComponentWrapper(sceneObject.parent);
  }

  return undefined;
}
