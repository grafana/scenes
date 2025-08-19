import { useEffect, useState } from 'react';
import { ContextValueBase } from '../contexts/ContextValueBase';

export function useContextState<TState>(model: ContextValueBase<TState>): TState {
  const [_, setState] = useState<TState>(model.state);

  useEffect(() => {
    const s = model.subscribeToState((state) => {
      setState(state);
    });

    return () => {
      s.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  return model.state;
}
