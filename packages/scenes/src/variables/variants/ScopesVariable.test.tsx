import React from 'react';

import { act, render, screen } from '@testing-library/react';

import { SceneVariableSet } from '../sets/SceneVariableSet';
import { EmbeddedScene } from '../../components/EmbeddedScene';
import { VariableValueSelectors } from '../components/VariableValueSelectors';
import { ScopesVariable } from './ScopesVariable';
import { ScopesContext, ScopesContextValue } from '@grafana/runtime';
import { Scope } from '@grafana/data';
import { BehaviorSubject } from 'rxjs';
import { SceneCSSGridLayout } from '../../components/layout/CSSGrid/SceneCSSGridLayout';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { sceneInterpolator } from '../interpolation/sceneInterpolator';

describe('ScopesVariable', () => {
  it('Should enable scopes on render and disable on unmount when enable: true', async () => {
    const { unmount, scopesContext } = renderTestScene();

    expect(scopesContext.state.enabled).toBe(true);

    unmount();

    expect(scopesContext.state.enabled).toBe(false);
  });

  it('Should update initial state on render', async () => {
    const { variable } = renderTestScene({ initialScopes: ['scope1', 'scope2'] });

    expect(variable.state.scopes.length).toEqual(2);
  });

  it('Should also interpolate as a variable and re-render when scopesContext change', async () => {
    const { scopesContext } = renderTestScene({ initialScopes: ['scope1', 'scope2'] });

    expect(screen.getByText('scopes = scope1, scope2')).toBeInTheDocument();

    act(() => {
      scopesContext.changeScopes(['scope3', 'scope4']);
    });

    expect(screen.getByText('scopes = scope3, scope4')).toBeInTheDocument();
  });

  it('Should start in loading state', async () => {
    const variable = new ScopesVariable({ enable: true });
    const set = new SceneVariableSet({ variables: [variable] });

    expect(set.isVariableLoadingOrWaitingToUpdate(variable)).toBe(true);
  });

  it('Should format as query parameters', async () => {
    const { scene } = renderTestScene({ initialScopes: ['scope1', 'scope2'] });

    // Interpolate using sceneInterpolator and the variable set as context
    expect(sceneInterpolator(scene, '${__scopes:queryparam}')).toEqual('scope=scope1&scope=scope2');
    expect(sceneInterpolator(scene, '${__scopes}')).toEqual('scope1, scope2');
  });
});

interface SetupOptions {
  initialScopes?: string[];
}

function renderTestScene(options: SetupOptions = {}) {
  const variable = new ScopesVariable({ enable: true });
  const scene = new EmbeddedScene({
    $variables: new SceneVariableSet({ variables: [variable] }),
    controls: [new VariableValueSelectors({})],
    body: new SceneCSSGridLayout({
      children: [new SceneCanvasText({ text: 'scopes = $__scopes' })],
    }),
  });

  const scopesContext: ScopesContextValue = new FakeScopesContext();

  if (options.initialScopes) {
    scopesContext.changeScopes(options.initialScopes);
  }

  const { unmount } = render(
    <ScopesContext.Provider value={scopesContext}>
      <scene.Component model={scene} />
    </ScopesContext.Provider>
  );

  return { unmount, scene, variable, scopesContext };
}

export class FakeScopesContext {
  state: ScopesContextValue['state'];
  stateObservable: BehaviorSubject<ScopesContextValue['state']>;

  public constructor() {
    this.state = { enabled: false, value: [], drawerOpened: false, loading: false, readOnly: false };
    this.stateObservable = new BehaviorSubject(this.state);
  }

  setEnabled = (enabled: boolean) => {
    this.state = { ...this.state, enabled };
    this.stateObservable.next(this.state);
  };

  setReadOnly = (readOnly: boolean) => {
    this.state = { ...this.state, readOnly };
    this.stateObservable.next(this.state);
  };

  changeScopes = (scopeNames: string[]) => {
    const value = scopeNames.map((name) => ({ spec: { title: name }, metadata: { name } } as Scope));
    this.state = { ...this.state, value };
    this.stateObservable.next(this.state);
  };
}
