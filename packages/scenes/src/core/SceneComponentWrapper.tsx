import React, { Context, useContext, useEffect, useState } from 'react';

import { SceneComponentProps, SceneObject } from './types';

function ContextsConsumer<T extends SceneObject>({ model }: SceneComponentProps<T>) {
  return model.reactContexts
    ?.getContextsList()
    .map((ctx, idx) => <MySceneObjectContextConsumer key={idx} ctx={ctx.context} model={model} />);
}

interface MySceneObjectContextConsumerProps {
  ctx: Context<any>;
  model: SceneObject;
}

function MySceneObjectContextConsumer({ ctx, model }: MySceneObjectContextConsumerProps) {
  const ctxValue = useContext(ctx);

  useEffect(() => {
    model.reactContexts?.updateContext(ctx, ctxValue);
  }, [ctx, ctxValue, model]);

  return null;
}

function ComponentRenderer<T extends SceneObject>({ model, ...otherProps }: SceneComponentProps<T>) {
  const Component = (model as any).constructor['Component'] ?? EmptyRenderer;
  const [_, setValue] = useState(0);

  useEffect(() => {
    const unsub = model.activate();
    setValue((prevState) => prevState + 1);
    return unsub;
  }, [model]);

  // By not rendering the component until the model is actiavted we make sure that parent models get activated before child models
  // Otherwise child models would be activated before parents as that is the order of React mount effects.
  // This also enables static logic to happen inside activate that can change state before the first render.
  if (!model.isActive && !model.renderBeforeActivation) {
    return null;
  }

  return <Component {...otherProps} model={model} />;
}

function SceneComponentWrapperWithoutMemo<T extends SceneObject>({ model, ...otherProps }: SceneComponentProps<T>) {
  return [
    <ContextsConsumer key="contexts" model={model} />,
    <ComponentRenderer key="component" model={model} {...otherProps} />,
  ];
}

export const SceneComponentWrapper = React.memo(SceneComponentWrapperWithoutMemo);

function EmptyRenderer<T>(_: SceneComponentProps<T>): React.ReactElement | null {
  return null;
}
