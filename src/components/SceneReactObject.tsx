import React from 'react';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneLayoutChildState } from '../core/types';

export interface SceneReactObjectState<TProps = {}> extends SceneLayoutChildState {
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
 * A utility object that can be used to render any React component or ReactNode
 */
export class SceneReactObject extends SceneObjectBase<SceneReactObjectState> {
  public static Component = ({ model }: SceneComponentProps<SceneReactObject>) => {
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
