import React from 'react';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneLayoutChildState } from '../core/types';

export interface JustRenderMyReactState<TProps = {}> extends SceneLayoutChildState {
  /**
   * React component to render
   */
  component?: React.ComponentType<TProps>;
  /**
   * Props to pass to the component
   */
  props?: TProps;
  /**
   * Alternative to component and props is just to pass a React node
   */
  reactNode?: React.ReactNode;
}

/**
 * Not a really useful component, just an example of how to create one
 * @internal
 */
export class JustRenderMyReact extends SceneObjectBase<JustRenderMyReactState> {
  public static Component = ({ model }: SceneComponentProps<JustRenderMyReact>) => {
    const { component: Component, props, reactNode } = model.useState();

    if (Component) {
      return <Component {...props} />;
    }

    if (reactNode) {
      return reactNode;
    }

    return null;
  };
}
