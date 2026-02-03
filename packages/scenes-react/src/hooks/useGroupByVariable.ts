import { GroupByVariable, sceneGraph } from '@grafana/scenes';
import type { AdHocVariableFilter, MetricFindValue } from '@grafana/data';
import type { DataSourceRef } from '@grafana/schema';
import { useEffect, useState } from 'react';
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
  /**
   * Optional static options (useful for demos / datasources without tag keys support).
   * When set, GroupByVariable will return these options without calling getTagKeys.
   */
  defaultOptions?: MetricFindValue[];
  /**
   * Optional override provider for tag keys lookup.
   * The concrete type is defined in `@grafana/scenes` but not currently exported as a public type.
   */
  getTagKeysProvider?: any;
}

export function useGroupByVariable(options: GroupByVariableOptions): GroupByVariable | null {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState(false);
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
      defaultOptions: options.defaultOptions,
      getTagKeysProvider: options.getTagKeysProvider,
    });
  }

  if (!(variable instanceof GroupByVariable)) {
    variable = null;
  }

  useEffect(() => {
    if (variable) {
      const remove = scene.addVariable(variable);
      setVariableAdded(true);
      return remove;
    }

    return;
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
      isEqual(variable.state.tagKeyRegexFilter, options.tagKeyRegexFilter) &&
      isEqual(variable.state.defaultOptions, options.defaultOptions) &&
      variable.state.getTagKeysProvider === options.getTagKeysProvider
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
      defaultOptions: options.defaultOptions,
      getTagKeysProvider: options.getTagKeysProvider,
    });

    variable.refreshOptions();
  }, [options, variable, variableAdded]);

  return variable;
}
