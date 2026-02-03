import { AdHocFiltersVariable, type AdHocFilterWithLabels, sceneGraph } from '@grafana/scenes';
import type { MetricFindValue } from '@grafana/data';
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
  /**
   * Optional override providers. Useful for demos and custom datasources.
   * The concrete types are defined in `@grafana/scenes` but not currently exported as public types.
   */
  getTagKeysProvider?: any;
  getTagValuesProvider?: any;
  defaultKeys?: MetricFindValue[];
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
      getTagKeysProvider: options.getTagKeysProvider,
      getTagValuesProvider: options.getTagValuesProvider,
      defaultKeys: options.defaultKeys,
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
    const nextFilters = options.filters;

    if (
      isEqual(variable.state.datasource, nextDatasource) &&
      // Only treat `filters` as controlled if explicitly provided.
      (nextFilters === undefined || isEqual(variable.state.filters, nextFilters)) &&
      isEqual(variable.state.baseFilters, options.baseFilters) &&
      isEqual(variable.state.originFilters, options.originFilters) &&
      variable.state.readOnly === options.readOnly &&
      variable.state.layout === options.layout &&
      variable.state.supportsMultiValueOperators === options.supportsMultiValueOperators &&
      variable.state.getTagKeysProvider === options.getTagKeysProvider &&
      variable.state.getTagValuesProvider === options.getTagValuesProvider &&
      isEqual(variable.state.defaultKeys, options.defaultKeys)
    ) {
      return;
    }

    const stateUpdate: Partial<AdHocFiltersVariable['state']> = {
      datasource: nextDatasource,
      baseFilters: options.baseFilters,
      originFilters: options.originFilters,
      readOnly: options.readOnly,
      layout: options.layout,
      supportsMultiValueOperators: options.supportsMultiValueOperators,
      getTagKeysProvider: options.getTagKeysProvider,
      getTagValuesProvider: options.getTagValuesProvider,
      defaultKeys: options.defaultKeys,
    };

    // Controlled mode: only update filters when provided.
    if (nextFilters !== undefined) {
      (stateUpdate as any).filters = nextFilters;
    }

    variable.setState(stateUpdate as any);
  }, [options, variable]);

  return variable;
}
