import { createContext, useContext } from 'react';
import { useObservable } from 'react-use';
import { Observable } from 'rxjs';

import { Scope } from '@grafana/data';

export interface ScopesContextValue {
  state: {
    isEnabled: boolean;
    isLoading: boolean;
    isReadOnly: boolean;
    value: Scope[];
  };
  stateObservable: Observable<ScopesContextValue['state']>;
  changeScopes: (scopeNames: string[]) => void;
  enterReadOnly: () => void;
  exitReadOnly: () => void;
  enable: () => void;
  disable: () => void;
}

export const ScopesContext = createContext<ScopesContextValue | undefined>(undefined);

export function useScopes() {
  const context = useContext(ScopesContext);

  useObservable(context?.stateObservable ?? new Observable(), context?.state);

  return context
    ? {
        state: context.state,
        stateObservable: context.stateObservable,
        changeScopes: context.changeScopes,
        enterReadOnly: context.enterReadOnly,
        exitReadOnly: context.exitReadOnly,
        enable: context.enable,
        disable: context.disable,
      }
    : undefined;
}
