import React, { useEffect, useState } from 'react';
import { GroupByVariable as GroupByVariableObject, type ControlsLayout, type VariableValue } from '@grafana/scenes';
import type { AdHocVariableFilter, MetricFindValue } from '@grafana/data';
import type { DataSourceRef } from '@grafana/schema';
import { isEqual } from 'lodash';

import { useSceneContext } from '../hooks/hooks';
import { VariableProps } from './types';

export interface GroupByVariableProps extends VariableProps {
  datasource?: DataSourceRef | null;
  baseFilters?: AdHocVariableFilter[];
  defaultOptions?: MetricFindValue[];
  defaultValue?: { text: VariableValue; value: VariableValue };
  restorable?: boolean;
  readOnly?: boolean;
  layout?: ControlsLayout;
  applyMode?: 'auto' | 'manual';
  tagKeyRegexFilter?: RegExp;
  getTagKeysProvider?: any;
  wideInput?: boolean;
  drilldownRecommendationsEnabled?: boolean;
  children: React.ReactNode;
}

export function GroupByVariable({
  name,
  label,
  hide,
  skipUrlSync,
  datasource = null,
  baseFilters,
  defaultOptions,
  defaultValue,
  restorable,
  readOnly,
  layout,
  applyMode,
  tagKeyRegexFilter,
  getTagKeysProvider,
  wideInput,
  drilldownRecommendationsEnabled,
  children,
}: GroupByVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState<boolean>();

  let variable: GroupByVariableObject | undefined = scene.findVariable(name);

  if (!variable) {
    variable = new GroupByVariableObject({
      name,
      label,
      hide,
      skipUrlSync,
      datasource,
      baseFilters,
      defaultOptions,
      defaultValue,
      restorable,
      readOnly,
      layout,
      applyMode,
      tagKeyRegexFilter,
      getTagKeysProvider,
      wideInput,
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
      isEqual(variable.state.defaultOptions, defaultOptions) &&
      isEqual(variable.state.defaultValue, defaultValue) &&
      variable.state.restorable === restorable &&
      variable.state.readOnly === readOnly &&
      variable.state.layout === layout &&
      variable.state.applyMode === applyMode &&
      isEqual(variable.state.tagKeyRegexFilter, tagKeyRegexFilter) &&
      variable.state.getTagKeysProvider === getTagKeysProvider &&
      variable.state.wideInput === wideInput &&
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
      baseFilters,
      defaultOptions,
      defaultValue,
      restorable,
      readOnly,
      layout,
      applyMode,
      tagKeyRegexFilter,
      getTagKeysProvider,
      wideInput,
      drilldownRecommendationsEnabled,
    });

    variable.refreshOptions();
  }, [
    applyMode,
    baseFilters,
    datasource,
    defaultOptions,
    defaultValue,
    drilldownRecommendationsEnabled,
    getTagKeysProvider,
    hide,
    label,
    layout,
    name,
    readOnly,
    restorable,
    skipUrlSync,
    tagKeyRegexFilter,
    variable,
    variableAdded,
    wideInput,
  ]);

  if (!variableAdded) {
    return null;
  }

  return children;
}
