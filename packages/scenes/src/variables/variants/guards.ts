import { AdHocFiltersVariable } from '../adhoc/AdHocFiltersVariable';
import { SceneVariable } from '../types';
import { ConstantVariable } from './ConstantVariable';
import { CustomVariable } from './CustomVariable';
import { DataSourceVariable } from './DataSourceVariable';
import { IntervalVariable } from './IntervalVariable';
import { TextBoxVariable } from './TextBoxVariable';
import { QueryVariable } from './query/QueryVariable';
import { GroupByVariable } from '../groupby/GroupByVariable';
import { SwitchVariable } from './SwitchVariable';

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
