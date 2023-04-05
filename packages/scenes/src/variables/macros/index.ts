import { DataLinkBuiltInVars } from '@grafana/data';
import { MacroVariableConstructor } from './types';
import { UrlTimeRangeMacro } from './UrlTimeRangeMacro';
import { AllVariablesMacro } from './AllVariablesMacro';
import { DataValueMacro } from './DataValueMacro';

export const macrosIndex: Record<string, MacroVariableConstructor> = {
  [DataLinkBuiltInVars.includeVars]: AllVariablesMacro,
  [DataLinkBuiltInVars.keepTime]: UrlTimeRangeMacro,
  ['__value']: DataValueMacro,
};
