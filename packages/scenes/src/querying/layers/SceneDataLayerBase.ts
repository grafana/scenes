import { DataTopic, PanelData } from '@grafana/data';
import { ReplaySubject, Unsubscribable } from 'rxjs';
import { emptyPanelData } from '../../core/SceneDataNode';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import {
  CancelActivationHandler,
  SceneDataLayerProvider,
  SceneDataLayerProviderResult,
  SceneDataLayerProviderState,
} from '../../core/types';
import { setBaseClassState } from '../../utils/utils';

/**
 * Base class for data layer. Handles common implementation including enabling/disabling layer and publishing results.
 */
export abstract class SceneDataLayerBase<T extends SceneDataLayerProviderState = SceneDataLayerProviderState>
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
  private _results = new ReplaySubject<SceneDataLayerProviderResult>();

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
   * Data topic that a given layer is responsible for.
   */
  public abstract topic: DataTopic;

  public constructor(initialState: T) {
    super({
      isEnabled: true,
      ...initialState,
    });

    this.addActivationHandler(() => this.onActivate());
  }

  protected onActivate(): CancelActivationHandler {
    if (this.state.isEnabled) {
      this.onEnable();
    }

    if (this.shouldRunQueriesOnActivate()) {
      this.runLayer();
    }

    // Subscribe to layer state changes and enable/disable layer accordingly.
    this.subscribeToState((n, p) => {
      if (!n.isEnabled && this.querySub) {
        // When layer disabled, cancel query and call onDisable that should publish empty results.
        this.querySub.unsubscribe();
        this.querySub = undefined;
        this.onDisable();

        this._results.next({
          origin: this,
          data: emptyPanelData,
          topic: this.topic,
        });
      }

      if (n.isEnabled && !p.isEnabled) {
        // When layer enabled, run queries.
        this.onEnable();
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
  }

  public cancelQuery() {
    if (this.querySub) {
      this.querySub.unsubscribe();
      this.querySub = undefined;

      this.publishResults(emptyPanelData, this.topic);
    }
  }

  protected publishResults(data: PanelData, topic: DataTopic) {
    if (this.state.isEnabled) {
      this._results.next({
        origin: this,
        data,
        topic,
      });

      this.setStateHelper({
        data,
      });
    }
  }

  public getResultsStream() {
    return this._results;
  }

  private shouldRunQueriesOnActivate() {
    if (this.state.data) {
      return false;
    }

    return true;
  }

  /**
   * This helper function is to counter the contravariance of setState
   */
  private setStateHelper(state: Partial<SceneDataLayerProviderState>) {
    setBaseClassState<SceneDataLayerProviderState>(this, state);
  }
}
