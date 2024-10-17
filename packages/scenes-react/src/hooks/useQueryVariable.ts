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

// adds or updates a query variable in the scene and returns it or null if
// the variable is not a QueryVariable
export function useQueryVariable(options: QueryVariableOptions): QueryVariable | null {
  const scene = useSceneContext();
  let variable = sceneGraph.lookupVariable(options.name, scene);

  if (!variable) {
    variable = new QueryVariable({ name: options.name, datasource: { uid: options.datasource }, query: options.query, regex: options.regex });
  }

  if (!(variable instanceof QueryVariable)) {
    variable = null;
  }

  useEffect(() => {
    if (variable) {
      scene.addVariable(variable)
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
