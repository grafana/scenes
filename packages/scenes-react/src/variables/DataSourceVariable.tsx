import React, { useEffect, useState } from 'react';
import { DataSourceVariable as DataSourceVariableObject } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks';
import { VariableRefresh, VariableSort } from '@grafana/schema';
import { VariableProps } from './types';

export interface DataSourceVariableProps extends VariableProps {
  pluginId: string;
  regex?: string;
  refresh?: VariableRefresh;
  sort?: VariableSort;
  isMulti?: boolean;
  includeAll?: boolean;
  children: React.ReactNode;
}

export function DataSourceVariable({
  pluginId,
  regex,
  name,
  label,
  hide,
  initialValue,
  isMulti,
  includeAll,
  skipUrlSync,
  allValue,
  children,
}: DataSourceVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState<boolean>();

  let variable: DataSourceVariableObject | undefined = scene.findVariable(name);

  if (!variable) {
    variable = new DataSourceVariableObject({
      pluginId,
      regex,
      name,
      label,
      value: initialValue,
      isMulti,
      hide,
      includeAll,
      skipUrlSync,
      allValue,
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
      variable.state.pluginId === pluginId &&
      variable.state.regex === regex &&
      variable.state.label === label &&
      variable.state.hide === hide &&
      variable.state.includeAll === includeAll &&
      variable.state.skipUrlSync === skipUrlSync &&
      variable.state.allValue === allValue
    ) {
      return;
    }

    variable.setState({
      pluginId,
      regex,
      label,
      hide,
      includeAll,
      skipUrlSync,
      allValue,
    });

    variable.refreshOptions();
  }, [skipUrlSync, allValue, hide, includeAll, label, pluginId, regex, variable, variableAdded]);

  // Need to block child rendering until the variable is added so that child components like RVariableSelect find the variable
  if (!variableAdded) {
    return null;
  }

  return children;
}
