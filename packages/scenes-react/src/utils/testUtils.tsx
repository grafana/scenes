import React, { useContext, useEffect, useState } from 'react';
import { SceneContext } from '../contexts/SceneContextProvider';
import { SceneContextObject } from '../contexts/SceneContextObject';
import { SceneVariable, SceneVariableSet } from '@grafana/scenes';

export interface TestContextProviderProps {
  /**
   * Only the initial time range, cannot be used to update time range
   **/
  value: SceneContextObject;
  /**
   * Children
   */
  children: React.ReactNode;
}

/**
 * Mostly useful from tests where you need to interact with the scene context object directly from outside the provider react tree.
 */
export function TestContextProvider({ children, value }: TestContextProviderProps) {
  const parentContext = useContext(SceneContext);
  const [isActivate, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    if (parentContext) {
      parentContext.setState({ childContext: value });
    }

    const deactivate = value.activate();
    setIsActive(true);

    return () => {
      deactivate();

      if (parentContext) {
        parentContext.setState({ childContext: undefined });
      }
    };
  }, [parentContext, value]);

  if (!isActivate) {
    return null;
  }

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}

interface GetHookContextWrapperOptions {
  variables?: SceneVariable[];
}

interface GetHookContextWrapperResult {
  wrapper: React.JSXElementConstructor<{ children: React.ReactNode }>;
  context: SceneContextObject;
}

export function getHookContextWrapper({ variables }: GetHookContextWrapperOptions): GetHookContextWrapperResult {
  const context = new SceneContextObject({
    $variables: variables ? new SceneVariableSet({ variables: variables }) : undefined,
  });

  const Wrapper = (props: React.PropsWithChildren) => {
    return <TestContextProvider value={context}>{props.children}</TestContextProvider>;
  };

  return { wrapper: Wrapper, context };
}
