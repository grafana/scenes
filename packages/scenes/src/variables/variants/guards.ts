import type { AdHocFiltersVariable } from '../adhoc/AdHocFiltersVariable';
import type { SceneVariable } from '../types';
import type { ConstantVariable } from './ConstantVariable';
import type { CustomVariable } from './CustomVariable';
import type { DataSourceVariable } from './DataSourceVariable';
import type { IntervalVariable } from './IntervalVariable';
import type { TextBoxVariable } from './TextBoxVariable';
import type { QueryVariable } from './query/QueryVariable';
import type { GroupByVariable } from '../groupby/GroupByVariable';
import type { SwitchVariable } from './SwitchVariable';

export function isAdHocVariable(variable: SceneVariable): variable is AdHocFiltersVariable {
  return variable.state.type === 'adhoc';
}

export function isConstantVariable(variable: SceneVariable): variable is ConstantVariable {
  return variable.state.type === 'constant';
}

export function isCustomVariable(variable: SceneVariable): variable is CustomVariable {
  return variable.state.type === 'custom';
}

export function isDataSourceVariable(variable: SceneVariable): variable is DataSourceVariable {
  return variable.state.type === 'datasource';
}

export function isIntervalVariable(variable: SceneVariable): variable is IntervalVariable {
  return variable.state.type === 'interval';
}

export function isQueryVariable(variable: SceneVariable): variable is QueryVariable {
  return variable.state.type === 'query';
}

export function isTextBoxVariable(variable: SceneVariable): variable is TextBoxVariable {
  return variable.state.type === 'textbox';
}

export function isGroupByVariable(variable: SceneVariable): variable is GroupByVariable {
  return variable.state.type === 'groupby';
}

export function isSwitchVariable(variable: SceneVariable): variable is SwitchVariable {
  return variable.state.type === 'switch';
}
