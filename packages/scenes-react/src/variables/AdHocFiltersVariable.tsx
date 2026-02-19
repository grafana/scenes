import React, { useEffect, useState } from 'react';
import {
  AdHocFiltersVariable as AdHocFiltersVariableObject,
  type AdHocFilterWithLabels,
  type ControlsLayout,
} from '@grafana/scenes';
import type { MetricFindValue } from '@grafana/data';
import type { DataSourceRef } from '@grafana/schema';
import { isEqual } from 'lodash';

import { useSceneContext } from '../hooks/hooks';
import { VariableProps } from './types';

export interface AdHocFiltersVariableProps extends VariableProps {
  datasource?: DataSourceRef | null;
  filters?: AdHocFilterWithLabels[];
  baseFilters?: AdHocFilterWithLabels[];
  originFilters?: AdHocFilterWithLabels[];
  readOnly?: boolean;
  layout?: ControlsLayout | 'combobox';
  addFilterButtonText?: string;
  tagKeyRegexFilter?: RegExp;
  defaultKeys?: MetricFindValue[];
  filterExpression?: string;
  expressionBuilder?: (filters: AdHocFilterWithLabels[]) => string;
  getTagKeysProvider?: any;
  getTagValuesProvider?: any;
  supportsMultiValueOperators?: boolean;
  useQueriesAsFilterForOptions?: boolean;
  allowCustomValue?: boolean;
  onAddCustomValue?: any;
  collapsible?: boolean;
  drilldownRecommendationsEnabled?: boolean;

  /**
   * `applyMode` is only used during variable construction.
   * If you need to change it, remount this component.
   */
  applyMode?: 'auto' | 'manual';
  children: React.ReactNode;
}

export function AdHocFiltersVariable({
  name,
  label,
  hide,
  skipUrlSync,
  children,
  datasource = null,
  filters,
  baseFilters,
  originFilters,
  readOnly,
  layout,
  addFilterButtonText,
  tagKeyRegexFilter,
  defaultKeys,
  filterExpression,
  expressionBuilder,
  getTagKeysProvider,
  getTagValuesProvider,
  supportsMultiValueOperators,
  useQueriesAsFilterForOptions,
  allowCustomValue,
  onAddCustomValue,
  collapsible,
  drilldownRecommendationsEnabled,
  applyMode,
}: AdHocFiltersVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState<boolean>();

  let variable: AdHocFiltersVariableObject | undefined = scene.findVariable(name);

  if (!variable) {
    variable = new AdHocFiltersVariableObject({
      name,
      label,
      hide,
      skipUrlSync,
      datasource,
      filters: filters ?? [],
      baseFilters,
      originFilters,
      applyMode,
      readOnly,
      layout,
      addFilterButtonText,
      tagKeyRegexFilter,
      defaultKeys,
      filterExpression,
      expressionBuilder,
      getTagKeysProvider,
      getTagValuesProvider,
      supportsMultiValueOperators,
      useQueriesAsFilterForOptions,
      allowCustomValue,
      onAddCustomValue,
      collapsible,
      drilldownRecommendationsEnabled,
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
      isEqual(variable.state.datasource, datasource) &&
      isEqual(variable.state.baseFilters, baseFilters) &&
      (filters === undefined || isEqual(variable.state.filters, filters)) &&
      variable.state.readOnly === readOnly &&
      variable.state.layout === layout &&
      variable.state.addFilterButtonText === addFilterButtonText &&
      isEqual(variable.state.tagKeyRegexFilter, tagKeyRegexFilter) &&
      isEqual(variable.state.defaultKeys, defaultKeys) &&
      variable.state.filterExpression === filterExpression &&
      variable.state.expressionBuilder === expressionBuilder &&
      variable.state.getTagKeysProvider === getTagKeysProvider &&
      variable.state.getTagValuesProvider === getTagValuesProvider &&
      variable.state.supportsMultiValueOperators === supportsMultiValueOperators &&
      variable.state.useQueriesAsFilterForOptions === useQueriesAsFilterForOptions &&
      variable.state.allowCustomValue === allowCustomValue &&
      variable.state.onAddCustomValue === onAddCustomValue &&
      variable.state.collapsible === collapsible &&
      variable.state.drilldownRecommendationsEnabled === drilldownRecommendationsEnabled
    ) {
      return;
    }

    variable.setState({
      name,
      label,
      hide,
      skipUrlSync,
      datasource,
      ...(filters !== undefined && { filters }),
      baseFilters,
      readOnly,
      layout,
      addFilterButtonText,
      tagKeyRegexFilter,
      defaultKeys,
      filterExpression,
      expressionBuilder,
      getTagKeysProvider,
      getTagValuesProvider,
      supportsMultiValueOperators,
      useQueriesAsFilterForOptions,
      allowCustomValue,
      onAddCustomValue,
      collapsible,
      drilldownRecommendationsEnabled,
    });
  }, [
    addFilterButtonText,
    allowCustomValue,
    baseFilters,
    filters,
    collapsible,
    datasource,
    defaultKeys,
    drilldownRecommendationsEnabled,
    expressionBuilder,
    getTagKeysProvider,
    getTagValuesProvider,
    hide,
    label,
    layout,
    name,
    onAddCustomValue,
    readOnly,
    filterExpression,
    skipUrlSync,
    supportsMultiValueOperators,
    tagKeyRegexFilter,
    useQueriesAsFilterForOptions,
    variable,
    variableAdded,
  ]);

  // Need to block child rendering until the variable is added so that child components can find the variable.
  if (!variableAdded) {
    return null;
  }

  return children;
}
