import { VARIABLE_NAMESPACE } from '../core/types';

export const getVariableName = (name: string, namespace?: string) => {
  return `${VARIABLE_NAMESPACE}-${namespace ? (namespace + '-') : ''}${name}`;
}
