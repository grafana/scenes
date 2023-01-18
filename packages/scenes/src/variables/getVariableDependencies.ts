import { VARIABLE_REGEX } from './constants';

export function getVariableDependencies(stringToCheck: string): string[] {
  VARIABLE_REGEX.lastIndex = 0;

  const matches = stringToCheck.matchAll(VARIABLE_REGEX);
  if (!matches) {
    return [];
  }

  const dependencies: string[] = [];

  for (const match of matches) {
    const [, var1, var2, , var3] = match;
    const variableName = var1 || var2 || var3;
    dependencies.push(variableName);
  }

  return dependencies;
}
