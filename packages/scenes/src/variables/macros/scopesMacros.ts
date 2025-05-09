import { Unsubscribable } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneObject } from '../../core/types';
import { SceneScopesBridge } from '../../core/SceneScopesBridge';
import { RefreshEvent } from '@grafana/runtime';
import { CustomVariableValue, VariableCustomFormatterFn } from '../types';
import { FormatVariable, formatRegistry } from '../interpolation/formatRegistry';
import { VariableFormatID } from '@grafana/schema';

export class ScopesMacro implements FormatVariable {
  public state: { name: string; type: string };
  private _scopesBridge?: SceneScopesBridge;
  private _subscription?: Unsubscribable;

  public constructor(name: string, private _sceneObject: SceneObject) {
    this.state = { name: name, type: 'scopes_macro' };
    this._scopesBridge = sceneGraph.getScopesBridge(this._sceneObject);

    // Subscribe to scope changes
    if (this._scopesBridge) {
      this._subscription = this._scopesBridge.subscribeToValue((newScopes, prevScopes) => {
        // Force a re-render when scopes change

        //this._sceneObject.forceRender();
        this._sceneObject.publishEvent(new RefreshEvent());
      });
    }

    // Add activation handler to handle cleanup
    this._sceneObject.addActivationHandler(() => {
      return () => {
        if (this._subscription) {
          this._subscription.unsubscribe();
          this._subscription = undefined;
        }
      };
    });
  }

  public getValue(fieldPath?: string) {
    const scopesBridge = this._scopesBridge;
    if (!scopesBridge) {
      return '';
    }
    const scopes = scopesBridge.getValue();
    const scopeNames = scopes.map((scope) => scope.metadata.name);

    return new ScopesMacroFormatter(scopeNames);
  }

  public getValueText(): string {
    const scopesBridge = this._scopesBridge;
    if (!scopesBridge) {
      return '';
    }

    const scopes = scopesBridge.getValue();
    return scopes.map((scope) => scope.metadata.name).join(',');
  }
}

class ScopesMacroFormatter implements CustomVariableValue {
  public constructor(private _scopes: string[]) {}

  public formatter(formatNameOrFn?: string | VariableCustomFormatterFn): string {
    if (!formatNameOrFn) {
      return this._scopes.join(',');
    }

    // Handle specific format overrides
    if (formatNameOrFn === VariableFormatID.QueryParam) {
      return this._scopes.map((scope) => `scope=${encodeURIComponent(scope)}`).join('&');
    }

    // For all other formats, use the default formatter from the registry
    const formatter = formatRegistry.getIfExists(formatNameOrFn as string);
    if (formatter) {
      return formatter.formatter(this._scopes, [], {
        state: { name: 'scopes', type: 'scopes_macro' },
        getValue: () => this._scopes,
      });
    }

    // Fallback to comma-separated list if format not found
    return this._scopes.join(',');
  }
}
