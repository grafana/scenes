import React, { useEffect, useState } from 'react';
import { ControlsLayout, AdHocFiltersVariable as AdHocFiltersVariableObject } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks';
import { VariableProps } from './types';
import { AdHocVariableFilter, MetricFindValue } from '@grafana/data';
import { DataSourceRef } from '@grafana/schema';
import {
  AdHocVariableExpressionBuilderFn,
  getTagKeysProvider,
  getTagValuesProvider,
} from '@grafana/scenes/src/variables/adhoc/AdHocFiltersVariable';

export interface AdHocFiltersVariableProps extends VariableProps {
  datasource: DataSourceRef | null;
  children: React.ReactNode;
  addFilterButtonText?: string;
  baseFilters?: AdHocVariableFilter[];
  readOnly?: boolean;
  layout?: ControlsLayout;
  applyMode?: 'auto' | 'manual';
  tagKeyRegexFilter?: RegExp;
  getTagKeysProvider?: getTagKeysProvider;
  getTagValuesProvider?: getTagValuesProvider;
  defaultKeys?: MetricFindValue[];
  filterExpression?: string;
  expressionBuilder?: AdHocVariableExpressionBuilderFn;
  supportsMultiValueOperators?: boolean;
  useQueriesAsFilterForOptions?: boolean;
  allowCustomValue?: boolean;
  //initialValue??
}

export function AdHocFiltersVariable({
  name,
  label,
  hide,
  //initialValue???
  datasource,
  baseFilters,
  readOnly,
  layout,
  applyMode = 'auto',
  tagKeyRegexFilter,
  getTagKeysProvider,
  getTagValuesProvider,
  defaultKeys,
  filterExpression,
  expressionBuilder,
  supportsMultiValueOperators,
  useQueriesAsFilterForOptions,
  allowCustomValue,
  children,
}: AdHocFiltersVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState<boolean>();

  let variable: AdHocFiltersVariableObject | undefined = scene.findVariable(name);

  if (!variable) {
    variable = new AdHocFiltersVariableObject({
      name,
      label,
      hide,
      datasource,
      baseFilters,
      readOnly,
      layout,
      applyMode,
      tagKeyRegexFilter,
      getTagKeysProvider,
      getTagValuesProvider,
      defaultKeys,
      filterExpression,
      expressionBuilder,
      supportsMultiValueOperators,
      useQueriesAsFilterForOptions,
      allowCustomValue,
    });
  }

  useEffect(() => {
    const removeFn = scene.addVariable(variable);
    setVariableAdded(true);
    return removeFn;
  }, [variable, scene, name]);

  useEffect(() => {
    variable?.setState({
      label,
      hide,
      datasource,
      baseFilters,
      readOnly,
      layout,
      applyMode,
      tagKeyRegexFilter,
      getTagKeysProvider,
      getTagValuesProvider,
      defaultKeys,
      filterExpression,
      expressionBuilder,
      supportsMultiValueOperators,
      useQueriesAsFilterForOptions,
      allowCustomValue,
    });
  }, [
    allowCustomValue,
    applyMode,
    baseFilters,
    datasource,
    defaultKeys,
    expressionBuilder,
    filterExpression,
    getTagKeysProvider,
    getTagValuesProvider,
    hide,
    label,
    layout,
    readOnly,
    scene,
    supportsMultiValueOperators,
    tagKeyRegexFilter,
    useQueriesAsFilterForOptions,
    variable,
  ]);

  // Need to block child rendering until the variable is added so that child components like RVariableSelect find the variable
  if (!variableAdded) {
    return null;
  }

  return children;
}
