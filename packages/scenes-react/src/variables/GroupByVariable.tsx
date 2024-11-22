import React, { useEffect, useState } from 'react';
import { ControlsLayout, GroupByVariable as GroupByVariableObject } from '@grafana/scenes';
import { useSceneContext } from '../hooks/hooks';
import { VariableProps } from './types';
import { AdHocVariableFilter, MetricFindValue } from '@grafana/data';
import { getTagKeysProvider } from '@grafana/scenes/src/variables/groupby/GroupByVariable';
import { DataSourceRef } from '@grafana/schema';

export interface GroupByVariableProps extends VariableProps {
  datasource: DataSourceRef | null;
  children: React.ReactNode;
  defaultOptions?: MetricFindValue[];
  baseFilters?: AdHocVariableFilter[];
  readOnly?: boolean;
  layout?: ControlsLayout;
  applyMode?: 'auto' | 'manual';
  tagKeyRegexFilter?: RegExp;
  getTagKeysProvider?: getTagKeysProvider;
  allowCustomValue?: boolean;
}

export function GroupByVariable({
  name,
  label,
  hide,
  initialValue,
  datasource,
  defaultOptions,
  baseFilters,
  readOnly,
  layout,
  applyMode = 'auto',
  tagKeyRegexFilter,
  getTagKeysProvider,
  allowCustomValue,
  children,
}: GroupByVariableProps): React.ReactNode {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState<boolean>();

  let variable: GroupByVariableObject | undefined = scene.findVariable(name);

  if (initialValue && !Array.isArray(initialValue)) {
    initialValue = [initialValue];
  }

  if (!variable) {
    variable = new GroupByVariableObject({
      name,
      label,
      datasource,
      value: initialValue,
      hide,
      defaultOptions,
      baseFilters,
      readOnly,
      layout,
      applyMode,
      tagKeyRegexFilter,
      getTagKeysProvider,
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
      datasource,
      hide,
      defaultOptions,
      baseFilters,
      readOnly,
      layout,
      applyMode,
      tagKeyRegexFilter,
      getTagKeysProvider,
      allowCustomValue,
    });
  }, [
    allowCustomValue,
    applyMode,
    baseFilters,
    datasource,
    defaultOptions,
    getTagKeysProvider,
    hide,
    initialValue,
    label,
    layout,
    readOnly,
    tagKeyRegexFilter,
    variable,
  ]);

  // Need to block child rendering until the variable is added so that child components like RVariableSelect find the variable
  if (!variableAdded) {
    return null;
  }

  return children;
}
