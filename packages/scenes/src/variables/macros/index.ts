import { DataLinkBuiltInVars } from '@grafana/data';
import { MacroVariableConstructor } from './types';
import { IntervalMacro, TimeFromAndToMacro, TimezoneMacro, UrlTimeRangeMacro } from './timeMacros';
import { AllVariablesMacro } from './AllVariablesMacro';
import { DataMacro, FieldMacro, SeriesMacro, ValueMacro } from './dataMacros';
import { UrlMacro } from './urlMacros';
import { OrgMacro, UserMacro } from './contextMacros';

export const macrosIndex = new Map<string, MacroVariableConstructor>([
  [DataLinkBuiltInVars.includeVars, AllVariablesMacro],
  [DataLinkBuiltInVars.keepTime, UrlTimeRangeMacro],
  ['__value', ValueMacro],
  ['__data', DataMacro],
  ['__series', SeriesMacro],
  ['__field', FieldMacro],
  ['__url', UrlMacro],
  ['__from', TimeFromAndToMacro],
  ['__to', TimeFromAndToMacro],
  ['__timezone', TimezoneMacro],
  ['__user', UserMacro],
  ['__org', OrgMacro],
  ['__interval', IntervalMacro],
  ['__interval_ms', IntervalMacro],
]);

/**
 * Allows you to register a variable expression macro that can then be used in strings with syntax ${<macro_name>.<fieldPath>}
 * Call this on app activation and unregister the macro on deactivation.
 * @param replace WARNING! If true, this will replace the existing macro with the same name. This is global and will affect all apps. Unregistering the macro will restore the original macro.
 * @returns a function that unregisters the macro
 */
export function registerVariableMacro(name: string, macro: MacroVariableConstructor, replace = false): () => void {
  if (!replace && macrosIndex.get(name)) {
    throw new Error(`Macro already registered ${name}`);
  }

  macrosIndex.set(name, macro);

  return () => {
    if (replace) {
      throw new Error(`Replaced macros can not be unregistered. They need to be restored manually.`);
    } else {
      macrosIndex.delete(name);
    }
  };
}
