import { QueryVariable, sceneGraph } from '@grafana/scenes';
import { useSceneContext } from './hooks';
import { useEffect } from 'react';

interface QueryVariableOptions {
  name: string;
  datasource: string;
  query: string;
  regex?: string;
}

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
    if (variable?.state.datasource?.uid !== options.datasource ||
      variable?.state.query !== options.query ||
      variable?.state.regex !== options.regex) {
      variable?.setState({ datasource: { uid: options.datasource }, query: options.query, regex: options.regex });
    }
  }, [options, variable]);

  return variable;
}
