import React, { useEffect } from 'react';
import { SceneContextProvider, SceneContextProviderProps } from './SceneContextProvider';
import { SceneContextObject } from './SceneContextObject';
import { useSceneContext } from '../hooks/hooks';
import { RenderResult, render } from '@testing-library/react';
import { behaviors } from '@grafana/scenes';
import { Router } from 'react-router-dom';
import { locationService } from '@grafana/runtime';

describe('SceneContextProvider', () => {
  it('Should activate on mount', () => {
    const s = setup({});

    expect(s.context?.isActive).toBe(true);
  });

  it('Should deactivate on unmount', () => {
    const s = setup({ timeRange: { from: '1m-now', to: 'now' }, withQueryController: true });

    s.renderResult.unmount();
    expect(s.context?.isActive).toBe(false);
  });

  it('Should set time range and query controller', () => {
    const s = setup({ timeRange: { from: '1m-now', to: 'now' }, withQueryController: true });

    expect(s.context!.state.$timeRange?.state.from).toBe('1m-now');
    expect(s.context!.state.$behaviors?.[0]).toBeInstanceOf(behaviors.SceneQueryController);
  });

  it('Can nest', () => {
    const s = setup({ timeRange: { from: '1m-now', to: 'now' }, withQueryController: true });

    expect(s.childContext?.parent).toBe(s.context);
  });
});

interface ChildTestProps {
  setCtx: (ctx: SceneContextObject) => void;
  children?: React.ReactNode;
}

function ChildTest({ setCtx, children }: ChildTestProps) {
  const ctx = useSceneContext();

  useEffect(() => {
    setCtx(ctx);
  }, [ctx, setCtx]);

  return children;
}

interface SetupResult {
  context?: SceneContextObject;
  childContext?: SceneContextObject;
  renderResult: RenderResult;
}

interface SetupProps extends Partial<SceneContextProviderProps> {}

function setup(props: SetupProps) {
  const result: SetupResult = {} as SetupResult;

  result.renderResult = render(
    <Router history={locationService.getHistory()}>
      <SceneContextProvider {...props}>
        <ChildTest setCtx={(c) => (result.context = c)}></ChildTest>
        <SceneContextProvider>
          <ChildTest setCtx={(c) => (result.childContext = c)}></ChildTest>
        </SceneContextProvider>
      </SceneContextProvider>
    </Router>
  );

  return result;
}
