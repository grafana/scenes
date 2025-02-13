import React, { useEffect } from 'react';
import { SceneContextProvider, SceneContextProviderProps } from './SceneContextProvider';
import { SceneContextObject } from './SceneContextObject';
import { useSceneContext } from '../hooks/hooks';
import { RenderResult, render } from '@testing-library/react';
import { behaviors } from '@grafana/scenes';
import { Router } from 'react-router-dom';
import { locationService, LocationServiceProvider } from '@grafana/runtime';

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

    expect(s.childContexts![0].parent).toBe(s.context);
  });

  it('Should hold sibling contexts', () => {
    const s = setup({ timeRange: { from: '1m-now', to: 'now' }, withQueryController: true });

    expect(s.childContexts![0].parent).toBe(s.context);
    expect(s.childContexts![1].parent).toBe(s.context);
  });

  it('Should deactivate children on unmount', () => {
    const s = setup({ timeRange: { from: '1m-now', to: 'now' }, withQueryController: true });

    s.renderResult.unmount();
    expect(s.childContexts![0].isActive).toBe(false);
    expect(s.childContexts![1].isActive).toBe(false);
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
  childContexts?: SceneContextObject[];
  renderResult: RenderResult;
}

interface SetupProps extends Partial<SceneContextProviderProps> {}

function setup(props: SetupProps) {
  const result: SetupResult = {} as SetupResult;
  const history = locationService.getHistory();

  result.renderResult = render(
    <LocationServiceProvider service={locationService}>
      <Router navigator={history} location={history.location}>
        <SceneContextProvider {...props}>
          <ChildTest setCtx={(c) => (result.context = c)}></ChildTest>
          <SceneContextProvider>
            <ChildTest setCtx={(c) => (result.childContexts = [...(result.childContexts ?? []), c])}></ChildTest>
          </SceneContextProvider>
          <SceneContextProvider>
            <ChildTest setCtx={(c) => (result.childContexts = [...(result.childContexts ?? []), c])}></ChildTest>
          </SceneContextProvider>
        </SceneContextProvider>
      </Router>
    </LocationServiceProvider>
  );

  return result;
}
