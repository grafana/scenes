import { QueryVariable, SceneDataQuery, sceneGraph } from '@grafana/scenes';
import { useSceneContext } from './hooks';
import { useEffect } from 'react';
import { isEqual } from 'lodash';

interface QueryVariableOptions {
  name: string;
  datasource: string;
  query: string | SceneDataQuery;
  regex?: string;
}

/**
 * A custom hook that creates or updates a `QueryVariable` in the scene context.
 *
 * @param {QueryVariableOptions} options - Options for configuring the `QueryVariable`.
 * @returns {QueryVariable | null} The `QueryVariable` instance or `null`.
 *
 * @example
 * // Usage example
 * const variable = useQueryVariable({
 *   name: "myQueryVariable",
 *   datasource: "gdev-testdata",
 *   query: "*",
 *   regex: ".*someFilter.*"
 * });
 *
 * // Returns a QueryVariable instance or null if not a valid QueryVariable
 * if (variable) {
 *   console.log("Variable added to the scene:", variable);
 * }
 */
export function useQueryVariable(options: QueryVariableOptions): QueryVariable | null {
  const scene = useSceneContext();
  let variable = sceneGraph.lookupVariable(options.name, scene);

  if (!variable) {
    variable = new QueryVariable({
      name: options.name,
      datasource: { uid: options.datasource },
      query: options.query,
      regex: options.regex,
    });
  }

  if (!(variable instanceof QueryVariable)) {
    variable = null;
  }

  useEffect(() => {
    if (variable) {
      scene.addVariable(variable);
    }
  }, [variable, scene]);

  useEffect(() => {
    if (
      variable?.state.datasource?.uid !== options.datasource ||
      !isEqual(variable?.state.query, options.query) ||
      variable?.state.regex !== options.regex
    ) {
      variable?.setState({ datasource: { uid: options.datasource }, query: options.query, regex: options.regex });
      variable?.refreshOptions();
    }
  }, [options, variable]);

  return variable;
}
