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
     });
  }

  useEffect(() => {
    if (variableAdded) {
      variable?.setState({
        pluginId,
        regex,
        name,
        label,
        value: initialValue, 
        isMulti,
        hide, 
        includeAll,
      })
    }

    const removeFn = scene.addVariable(variable);
    setVariableAdded(true);
    return removeFn;
  }, [variable, scene, name, variableAdded, label, regex, initialValue, isMulti, hide, includeAll, pluginId]);


  // Need to block child rendering until the variable is added so that child components like RVariableSelect find the variable
  if (!variableAdded) {
    return null;
  }

  return children;
}
