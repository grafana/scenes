import { MultiValueVariable, VariableValueOption, sceneGraph } from '@grafana/scenes';
import { useSceneContext } from './hooks';
import { useEffect, useState } from 'react';
import { lastValueFrom } from 'rxjs';

export function useVariableQuery(name: string): VariableValueOption[] {
  const scene = useSceneContext();
  const variable = sceneGraph.lookupVariable(name, scene);
  const [valueOptions, setValueOptions] = useState<VariableValueOption[]>([]);

  useEffect(() => {
    if (!variable || !(variable instanceof MultiValueVariable)) {
      setValueOptions([]);
      return;
    }

    const getQueryOptions = async () => {
      const value = await lastValueFrom(variable.getValueOptions({}));
      setValueOptions(value);
    };

    getQueryOptions();
  }, [variable]);

  return valueOptions;
}
