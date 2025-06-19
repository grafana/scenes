import { PanelData } from '@grafana/data';
import { ReplaySubject, Unsubscribable } from 'rxjs';
import { emptyPanelData } from '../../core/SceneDataNode';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import {
  CancelActivationHandler,
  SceneDataLayerProvider,
  SceneDataProviderResult,
  SceneDataLayerProviderState,
} from '../../core/types';
import { setBaseClassState } from '../../utils/utils';
import { writeSceneLog } from '../../utils/writeSceneLog';
import { VariableDependencyConfig } from '../../variables/VariableDependencyConfig';
import { VariableValueRecorder } from '../../variables/VariableValueRecorder';

/**
 * Base class for data layer. Handles common implementation including enabling/disabling layer and publishing results.
 */
export abstract class SceneDataLayerBase<T extends SceneDataLayerProviderState>
  extends SceneObjectBase<T>
  implements SceneDataLayerProvider
{
  /**
   * Subscription to query results. Should be set when layer runs a query.
   */
  protected querySub?: Unsubscribable;

  /**
   * Subject to emit results to.
   */
  private _results = new ReplaySubject<SceneDataProviderResult>(1);

  /**
   * Implement logic for enabling the layer. This is called when layer is enabled or when layer is enabled when activated.
   * Use i.e. to setup subscriptions that will trigger layer updates.
   */
  public abstract onEnable(): void;

  /**
   * Implement logic for disabling the layer. This is called when layer is disabled.
   * Use i.e. to unsubscribe from subscriptions that trigger layer updates.
   */
  public abstract onDisable(): void;

  /**
   * Implement logic running the layer and setting up the querySub subscription.
   */
  protected abstract runLayer(): void;

  /**
   * Mark data provider as data layer
   */
  public isDataLayer: true = true;

  private _variableValueRecorder = new VariableValueRecorder();

  protected _variableDependency: VariableDependencyConfig<T> = new VariableDependencyConfig(this, {
    onVariableUpdateCompleted: this.onVariableUpdateCompleted.bind(this),
    dependsOnScopes: true,
  });

  /**
   * For variables support in data layer provide variableDependencyStatePaths with keys of the state to be scanned for variables.
   */
  public constructor(initialState: T, variableDependencyStatePaths: Array<keyof T> = []) {
    super({
      isEnabled: true,
      ...initialState,
    });

    this._variableDependency.setPaths(variableDependencyStatePaths);
    this.addActivationHandler(() => this.onActivate());
  }

  protected onActivate(): CancelActivationHandler {
    if (this.state.isEnabled) {
      this.onEnable();
    }

    if (this.shouldRunLayerOnActivate()) {
      this.runLayer();
    }

    // Subscribe to layer state changes and enable/disable layer accordingly.
    this.subscribeToState((n, p) => {
      if (!n.isEnabled && this.querySub) {
        // When layer disabled, cancel query and call onDisable that should publish empty results.
        this.querySub.unsubscribe();
        this.querySub = undefined;
        this.onDisable();

        // Manually publishing the results to state and results stream as publishPublish results has a guard for the layer to be enabled.
        this._results.next({ origin: this, data: emptyPanelData });

        this.setStateHelper({ data: emptyPanelData });
      }

      if (n.isEnabled && !p.isEnabled) {
        // When layer enabled, run queries.
        this.onEnable();
        this.runLayer();
      }
    });

    return () => {
      this.onDeactivate();
    };
  }

  protected onDeactivate(): void {
    if (this.querySub) {
      this.querySub.unsubscribe();
      this.querySub = undefined;
    }

    this.onDisable();

    this._variableValueRecorder.recordCurrentDependencyValuesForSceneObject(this);
  }

  protected onVariableUpdateCompleted(): void {
    this.runLayer();
  }

  public cancelQuery() {
    if (this.querySub) {
      this.querySub.unsubscribe();
      this.querySub = undefined;

      this.publishResults(emptyPanelData);
    }
  }

  protected publishResults(data: PanelData) {
    if (this.state.isEnabled) {
      this._results.next({ origin: this, data });
      this.setStateHelper({ data });
    }
  }

  public getResultsStream() {
    return this._results;
  }

  private shouldRunLayerOnActivate() {
    if (!this.state.isEnabled) {
      return false;
    }

    if (this._variableValueRecorder.hasDependenciesChanged(this)) {
      writeSceneLog(
        'SceneDataLayerBase',
        'Variable dependency changed while inactive, shouldRunLayerOnActivate returns true'
      );
      return true;
    }

    if (!this.state.data) {
      return true;
    }

    return false;
  }

  /**
   * This helper function is to counter the contravariance of setState
   */
  private setStateHelper(state: Partial<SceneDataLayerProviderState>) {
    setBaseClassState<SceneDataLayerProviderState>(this, state);
  }
}
