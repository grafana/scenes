import React, { useEffect, useState } from 'react';
import { QueryVariable as QueryVariableObject, SceneDataQuery } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks';
import { DataSourceRef, VariableRefresh, VariableSort } from '@grafana/schema';
import { VariableProps } from './types';

export interface QueryVariableProps extends VariableProps {
  query: string | SceneDataQuery;
  datasource: DataSourceRef | null;
  regex?: string;
  refresh?: VariableRefresh;
  sort?: VariableSort;
  isMulti?: boolean;
  includeAll?: boolean;
  children: React.ReactNode;
}

export function QueryVariable({
  query,
  name,
  datasource,
  label,
  hide,
  regex,
  refresh,
  sort,
  initialValue,
  isMulti,
  includeAll,
  children,
}: QueryVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState<boolean>();

  let variable: QueryVariableObject | undefined = scene.findVariable(name);

  if (!variable) {
    variable = new QueryVariableObject({ 
      name,
      label,
      query,
      datasource, 
      refresh, 
      sort, 
      regex, 
      value: initialValue, 
      isMulti,
      hide, 
      includeAll,
     });
  }

  useEffect(() => {
    if (variableAdded) {
      variable?.setState({
        label,
        query,
        datasource, 
        refresh, 
        sort, 
        regex, 
        value: initialValue, 
        isMulti,
        hide, 
        includeAll,
      })
    }

    const removeFn = scene.addVariable(variable);
    setVariableAdded(true);
    return removeFn;
  }, [variable, scene, name, variableAdded, label, query, datasource, refresh, sort, regex, initialValue, isMulti, hide, includeAll]);


  // Need to block child rendering until the variable is added so that child components like RVariableSelect find the variable
  if (!variableAdded) {
    return null;
  }

  return children;
}
