import { LocalValueVariable, type VariableValue, sceneGraph } from '@grafana/scenes';
import { useEffect } from 'react';
import { isEqual } from 'lodash';

import { useSceneContext } from './hooks';

export interface LocalValueVariableOptions {
  name: string;
  value?: VariableValue;
  text?: VariableValue;
  properties?: Record<string, any>;
  isMulti?: boolean;
  includeAll?: boolean;
}

export function useLocalValueVariable(options: LocalValueVariableOptions): LocalValueVariable | null {
  const scene = useSceneContext();
  let variable = sceneGraph.lookupVariable(options.name, scene);

  if (!variable) {
    variable = new LocalValueVariable({
      name: options.name,
      value: options.value ?? '',
      text: options.text ?? '',
      properties: options.properties,
      isMulti: options.isMulti,
      includeAll: options.includeAll,
    });
  }

  if (!(variable instanceof LocalValueVariable)) {
    variable = null;
  }

  useEffect(() => {
    if (variable) {
      scene.addVariable(variable);
    }
  }, [scene, variable]);

  useEffect(() => {
    if (!variable) {
      return;
    }

    const nextValue = options.value ?? '';
    const nextText = options.text ?? '';

    if (
      isEqual(variable.state.value, nextValue) &&
      isEqual(variable.state.text, nextText) &&
      isEqual(variable.state.properties, options.properties) &&
      variable.state.isMulti === options.isMulti &&
      variable.state.includeAll === options.includeAll
    ) {
      return;
    }

    variable.setState({
      value: nextValue,
      text: nextText,
      properties: options.properties,
      isMulti: options.isMulti,
      includeAll: options.includeAll,
    });
  }, [options, variable]);

  return variable;
}

