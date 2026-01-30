import { AdHocFiltersVariable, type AdHocFilterWithLabels, sceneGraph } from '@grafana/scenes';
import type { DataSourceRef } from '@grafana/schema';
import { useEffect } from 'react';
import { isEqual } from 'lodash';

import { useSceneContext } from './hooks';

export interface AdHocFiltersVariableOptions {
  name: string;
  datasource?: DataSourceRef | null;
  filters?: AdHocFilterWithLabels[];
  baseFilters?: AdHocFilterWithLabels[];
  originFilters?: AdHocFilterWithLabels[];
  readOnly?: boolean;
  layout?: 'horizontal' | 'vertical' | 'combobox';
  supportsMultiValueOperators?: boolean;
  applyMode?: 'auto' | 'manual';
}

export function useAdHocFiltersVariable(options: AdHocFiltersVariableOptions): AdHocFiltersVariable | null {
  const scene = useSceneContext();
  let variable = sceneGraph.lookupVariable(options.name, scene);

  if (!variable) {
    variable = new AdHocFiltersVariable({
      name: options.name,
      datasource: options.datasource ?? null,
      filters: options.filters ?? [],
      baseFilters: options.baseFilters,
      originFilters: options.originFilters,
      readOnly: options.readOnly,
      layout: options.layout,
      supportsMultiValueOperators: options.supportsMultiValueOperators,
      applyMode: options.applyMode,
    });
  }

  if (!(variable instanceof AdHocFiltersVariable)) {
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
    const nextFilters = options.filters ?? [];

    if (
      isEqual(variable.state.datasource, nextDatasource) &&
      isEqual(variable.state.filters, nextFilters) &&
      isEqual(variable.state.baseFilters, options.baseFilters) &&
      isEqual(variable.state.originFilters, options.originFilters) &&
      variable.state.readOnly === options.readOnly &&
      variable.state.layout === options.layout &&
      variable.state.supportsMultiValueOperators === options.supportsMultiValueOperators
    ) {
      return;
    }

    variable.setState({
      datasource: nextDatasource,
      filters: nextFilters,
      baseFilters: options.baseFilters,
      originFilters: options.originFilters,
      readOnly: options.readOnly,
      layout: options.layout,
      supportsMultiValueOperators: options.supportsMultiValueOperators,
    });
  }, [options, variable]);

  return variable;
}

