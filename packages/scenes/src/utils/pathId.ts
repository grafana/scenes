import { SceneObject } from '../core/types';
import { LocalValueVariable } from '../variables/variants/LocalValueVariable';

export const PATH_ID_SEPARATOR = '$';

/**
 * Returns a unique path for a given VizPanel based on the panels peristance id and any local variable value contexts.
 * This is used to create a unique URL key identifiers for panels and repeated panels.
 */
export function buildPathIdFor(sceneObj: SceneObject): string {
  let pathId = sceneObj.state.key!;
  let lastName: string | undefined;
  let currentObj: SceneObject | undefined = sceneObj;

  while (currentObj) {
    const variables = currentObj.state.$variables;
    if (variables) {
      variables.state.variables.forEach((variable) => {
        if (variable.state.name === lastName) {
          // Skip if the variable name is the same as the last one
          // This happens as the source row has a local variable value and the child repeats
          return;
        }

        if (variable instanceof LocalValueVariable) {
          pathId = `${variable.state.value}${PATH_ID_SEPARATOR}${pathId}`;
          lastName = variable.state.name;
        }
      });
    }

    currentObj = currentObj.parent;
  }

  return pathId;
}
