import React from 'react';
import { SceneObject } from '../core/types';

export function renderSceneComponentWithExtraProps<T extends SceneObject, E>(model: T, extraProps: E) {
  return React.createElement(model.Component, { model, ...extraProps });
}
