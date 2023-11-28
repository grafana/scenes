import React, { useEffect } from 'react';

import { SceneComponentProps, SceneObject, SceneObjectClass } from './types';

function SceneComponentWrapperWithoutMemo<T extends SceneObject>({ model, ...otherProps }: SceneComponentProps<T>) {
  const ClassType = model.constructor as SceneObjectClass;
  const Component = ClassType.Component ?? EmptyRenderer;
  const [activated, setActivated] = React.useState(false);

  useEffect(() => {
    setActivated(true);
    return model.activate();
  }, [model]);

  // By not rendering the component until the model is actiavted we make sure that parent models get activated before child models
  // Otherwise child models would be activated before parents as that is the order of React mount effects.
  // This also enables static logic to happen inside activate that can change state before the first render.
  if (!activated && !ClassType.UNSAFE_renderBeforeActive) {
    return null;
  }

  return <Component {...otherProps} model={model} />;
}

export const SceneComponentWrapper = React.memo(SceneComponentWrapperWithoutMemo);

function EmptyRenderer<T>(_: SceneComponentProps<T>): React.ReactElement | null {
  return null;
}
