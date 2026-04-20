import React, { useEffect, useState } from 'react';
import { LocalValueVariable as LocalValueVariableObject, type VariableValue } from '@grafana/scenes';
import { isEqual } from 'lodash';

import { useSceneContext } from '../hooks/hooks';
import { VariableProps } from './types';

export interface LocalValueVariableProps extends VariableProps {
  value?: VariableValue;
  text?: VariableValue;
  properties?: Record<string, any>;
  isMulti?: boolean;
  includeAll?: boolean;
  children: React.ReactNode;
}

export function LocalValueVariable({
  name,
  label,
  hide,
  skipUrlSync,
  value,
  text,
  properties,
  isMulti,
  includeAll,
  children,
}: LocalValueVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState<boolean>();

  let variable: LocalValueVariableObject | undefined = scene.findVariable(name);

  if (!variable) {
    variable = new LocalValueVariableObject({
      name,
      label,
      hide,
      skipUrlSync,
      value,
      text,
      properties,
      isMulti,
      includeAll,
    });
  }

  useEffect(() => {
    const removeFn = scene.addVariable(variable);
    setVariableAdded(true);
    return removeFn;
  }, [variable, scene, name]);

  useEffect(() => {
    if (!variableAdded) {
      return;
    }

    if (
      variable.state.name === name &&
      variable.state.label === label &&
      variable.state.hide === hide &&
      variable.state.skipUrlSync === skipUrlSync &&
      isEqual(variable.state.value, value) &&
      isEqual(variable.state.text, text) &&
      isEqual(variable.state.properties, properties) &&
      variable.state.isMulti === isMulti &&
      variable.state.includeAll === includeAll
    ) {
      return;
    }

    variable.setState({
      name,
      label,
      hide,
      skipUrlSync,
      value,
      text,
      properties,
      isMulti,
      includeAll,
    });
  }, [includeAll, hide, isMulti, label, name, properties, skipUrlSync, text, value, variable, variableAdded]);

  if (!variableAdded) {
    return null;
  }

  return children;
}
