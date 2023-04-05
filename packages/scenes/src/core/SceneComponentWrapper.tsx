import React, { useEffect } from 'react';

import { SceneComponentProps, SceneObject } from './types';

function SceneComponentWrapperWithoutMemo<T extends SceneObject>({ model, ...otherProps }: SceneComponentProps<T>) {
  const Component = (model as any).constructor['Component'] ?? EmptyRenderer;

  useEffect(() => model.activate(), [model]);

  return <Component {...otherProps} model={model} />;
}

export const SceneComponentWrapper = React.memo(SceneComponentWrapperWithoutMemo);

function EmptyRenderer<T>(_: SceneComponentProps<T>): React.ReactElement | null {
  return null;
}
