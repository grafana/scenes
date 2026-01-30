import { GroupByVariable, sceneGraph } from '@grafana/scenes';
import type { AdHocVariableFilter } from '@grafana/data';
import type { DataSourceRef } from '@grafana/schema';
import { useEffect } from 'react';
import { isEqual } from 'lodash';

import { useSceneContext } from './hooks';

export interface GroupByVariableOptions {
  name: string;
  datasource?: DataSourceRef | null;
  baseFilters?: AdHocVariableFilter[];
  readOnly?: boolean;
  layout?: 'horizontal' | 'vertical';
  applyMode?: 'auto' | 'manual';
  tagKeyRegexFilter?: RegExp;
}

export function useGroupByVariable(options: GroupByVariableOptions): GroupByVariable | null {
  const scene = useSceneContext();
  let variable = sceneGraph.lookupVariable(options.name, scene);

  if (!variable) {
    variable = new GroupByVariable({
      name: options.name,
      datasource: options.datasource ?? null,
      baseFilters: options.baseFilters,
      readOnly: options.readOnly,
      layout: options.layout,
      applyMode: options.applyMode,
      tagKeyRegexFilter: options.tagKeyRegexFilter,
    });
  }

  if (!(variable instanceof GroupByVariable)) {
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

    const nextDatasource = options.datasource ?? null;

    if (
      isEqual(variable.state.datasource, nextDatasource) &&
      isEqual(variable.state.baseFilters, options.baseFilters) &&
      variable.state.readOnly === options.readOnly &&
      variable.state.layout === options.layout &&
      variable.state.applyMode === options.applyMode &&
      isEqual(variable.state.tagKeyRegexFilter, options.tagKeyRegexFilter)
    ) {
      return;
    }

    variable.setState({
      datasource: nextDatasource,
      baseFilters: options.baseFilters,
      readOnly: options.readOnly,
      layout: options.layout,
      applyMode: options.applyMode,
      tagKeyRegexFilter: options.tagKeyRegexFilter,
    });

    variable.refreshOptions();
  }, [options, variable]);

  return variable;
}

