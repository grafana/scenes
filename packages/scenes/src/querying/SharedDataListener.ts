import { Unsubscribable } from 'rxjs';
import { SceneDataNodeState } from '../core/SceneDataNode';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneDataProvider } from '../core/types';

export interface SharedDataListenerState extends SceneDataNodeState {
  // FUTURE?
  // providerKey // key for the node we want to listen to?
  // includeTransformations? // with or without transformation node?

  // Where the data actually comes from
  provider: SceneDataProvider;
}

/**
 * This allows a node to listen for changes to data elsewhere in the tree.
 */
export class SharedDataListener extends SceneObjectBase<SharedDataListenerState> implements SceneDataProvider {
  private _sub?: Unsubscribable; // ??? necessary

  public constructor(state: SharedDataListenerState) {
    super(state);

    this.addActivationHandler(() => this.activationHandler());
  }

  private activationHandler() {
    const sourceData = this.state.provider; // ??? 

    if (!sourceData) {
      throw new Error('SharedDataListener must have provider defined');
    }

    this._subs.add(sourceData.subscribeToState((state) => this.setState({data: state.data})));

    return () => {
      if (this._sub) {
        this._sub.unsubscribe();
      }
    };
  }

  public setContainerWidth(width: number) {
    // will use the upstream values
  }
}
