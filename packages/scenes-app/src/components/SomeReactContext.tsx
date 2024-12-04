import React, { createContext, useMemo, useState } from 'react';

export interface SomeReactContextValue {
  value: number;
  setValue: (value: number) => void;
}

export const SomeReactContext = createContext<SomeReactContextValue>({ value: 0, setValue: () => undefined });

interface Props {
  children: React.ReactNode;
}

export const SomeReactContextProvider = ({ children }: Props) => {
  const [value, setValue] = useState(0);

  const contextValue = useMemo(() => ({ value, setValue }), [value, setValue]);

  return <SomeReactContext.Provider value={contextValue}>{children}</SomeReactContext.Provider>;
};
