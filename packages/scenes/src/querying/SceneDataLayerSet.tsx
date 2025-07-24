import { DataFrame } from '@grafana/data';
import { Observable, ReplaySubject, Unsubscribable } from 'rxjs';
import { emptyPanelData } from '../core/SceneDataNode';
import { SceneObjectBase } from '../core/SceneObjectBase';
import {
  SceneComponentProps,
  SceneDataLayerProvider,
  SceneDataLayerProviderState,
  SceneDataProviderResult,
} from '../core/types';
import { DataLayersMerger } from './DataLayersMerger';
import { setBaseClassState } from '../utils/utils';

export abstract class SceneDataLayerSetBase<T extends SceneDataLayerProviderState>
  extends SceneObjectBase<T>
  implements SceneDataLayerProvider
{
  /** Mark it as a data layer */
  public isDataLayer: true = true;

  /**
   * Subscription to query results. Should be set when layer runs a query.
   */
  protected querySub?: Unsubscribable;

  /**
   * Subject to emit results to.
   */
  private _results = new ReplaySubject<SceneDataProviderResult>(1);
  private _dataLayersMerger = new DataLayersMerger();

  protected subscribeToAllLayers(layers: SceneDataLayerProvider[]) {
    if (layers.length > 0) {
      this.querySub = this._dataLayersMerger.getMergedStream(layers).subscribe(this._onLayerUpdateReceived.bind(this));
    } else {
      this._results.next({ origin: this, data: emptyPanelData });
      this.setStateHelper({ data: emptyPanelData });
    }
  }

  private _onLayerUpdateReceived(results: Iterable<SceneDataProviderResult>) {
    let series: DataFrame[] = [];

    for (const result of results) {
      if (result.data?.series) {
        series = series.concat(result.data.series);
      }
    }

    const combinedData = { ...emptyPanelData, series: series };

    this._results.next({ origin: this, data: combinedData });
    this.setStateHelper({ data: combinedData });
  }

  public getResultsStream(): Observable<SceneDataProviderResult> {
    return this._results;
  }

  public cancelQuery() {
    this.querySub?.unsubscribe();
  }

  /**
   * This helper function is to counter the contravariance of setState
   */
  private setStateHelper(state: Partial<SceneDataLayerProviderState>) {
    setBaseClassState<SceneDataLayerProviderState>(this, state);
  }
}

export interface SceneDataLayersSetState extends SceneDataLayerProviderState {
  layers: SceneDataLayerProvider[];
}

export class SceneDataLayerSet
  extends SceneDataLayerSetBase<SceneDataLayersSetState>
  implements SceneDataLayerProvider
{
  public constructor(state: Partial<SceneDataLayersSetState>) {
    super({
      name: state.name ?? 'Data layers',
      layers: state.layers ?? [],
    });

    this.addActivationHandler(() => this._onActivate());
  }

  private _onActivate() {
    this._subs.add(
      this.subscribeToState((newState, oldState) => {
        if (newState.layers !== oldState.layers) {
          this.querySub?.unsubscribe();
          this.subscribeToAllLayers(newState.layers);
        }
      })
    );

    this.subscribeToAllLayers(this.state.layers);

    return () => {
      this.querySub?.unsubscribe();
    };
  }

  public static Component = ({ model }: SceneComponentProps<SceneDataLayerSet>) => {
    const { layers } = model.useState();

    return (
      <>
        {layers.map((layer) => (
          <layer.Component model={layer} key={layer.state.key} />
        ))}
      </>
    );
  };
}
