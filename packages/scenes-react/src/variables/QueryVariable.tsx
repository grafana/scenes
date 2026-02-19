import React, { useEffect, useState } from 'react';
import { QueryVariable as QueryVariableObject, SceneDataQuery } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks';
import { DataSourceRef, VariableRefresh, VariableSort } from '@grafana/schema';
import { VariableProps } from './types';
import { isEqual } from 'lodash';

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
  skipUrlSync,
  allValue,
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
      isEqual(variable.state.query, query) &&
      isEqual(variable.state.datasource, datasource) &&
      variable.state.regex === regex &&
      variable.state.label === label &&
      variable.state.hide === hide &&
      variable.state.includeAll === includeAll &&
      variable.state.refresh === refresh &&
      variable.state.sort === sort &&
      variable.state.skipUrlSync === skipUrlSync &&
      variable.state.allValue === allValue
    ) {
      return;
    }

    variable.setState({
      label,
      query,
      datasource,
      refresh,
      sort,
      regex,
      hide,
      includeAll,
      skipUrlSync,
      allValue,
    });

    variable.refreshOptions();
  }, [
    skipUrlSync,
    allValue,
    datasource,
    hide,
    includeAll,
    label,
    query,
    refresh,
    regex,
    sort,
    variable,
    variableAdded,
  ]);

  // Need to block child rendering until the variable is added so that child components like RVariableSelect find the variable
  if (!variableAdded) {
    return null;
  }

  return children;
}
