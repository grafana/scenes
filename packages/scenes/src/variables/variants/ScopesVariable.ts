import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, VariableValue } from '../types';
import { sceneGraph } from '../../core/sceneGraph';
import { Scope } from '@grafana/data';

export interface ScopesVariableState extends SceneVariableState {
  scopes?: Scope[];
}

export class ScopesVariable<T extends object>
  extends SceneObjectBase<ScopesVariableState>
  implements SceneVariable<ScopesVariableState>
{
  public constructor(state: ScopesVariableState) {
    super({
      skipUrlSync: true,
      ...state,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  private onActivate() {
    const scopesBridge = sceneGraph.getScopesBridge(this);
    if (!scopesBridge) {
      console.warn('ScopesVariable activated but no scopes bridge found');
      return;
    }

    const scopesSub = scopesBridge.subscribeToValue(() => {
      console.log('scopes isloading', scopesBridge.isLoading());
      console.log('scopes value', scopesBridge.getValue());
      this.setState({ scopes: scopesBridge.getValue(), loading: scopesBridge.isLoading() });
    });

    return () => scopesSub.unsubscribe();
  }

  /**
   * Temporary simple implementation to stringify the scopes.
   */
  public getValue(fieldPath: string): VariableValue {
    const scopes = this.state.scopes ?? [];
    const scopeNames = scopes.map((scope) => scope.metadata.name);
    return scopeNames.join(', ');
  }

  public getScopes(): Scope[] | undefined {
    return this.state.scopes;
  }
}
