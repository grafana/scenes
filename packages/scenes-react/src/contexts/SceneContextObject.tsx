import {
  SceneObjectBase,
  SceneObject,
  SceneObjectState,
  SceneVariable,
  SceneVariableSet,
  getUrlSyncManager,
  SceneDataLayerSet,
  SceneDataLayerProvider,
} from '@grafana/scenes';
import { writeSceneLog } from '../utils';

export interface SceneContextObjectState extends SceneObjectState {
  childContext?: SceneContextObject;
  children: SceneObject[];
}

export class SceneContextObject extends SceneObjectBase<SceneContextObjectState> {
  public constructor(state?: Partial<SceneContextObjectState>) {
    super({
      ...state,
      children: state?.children ?? [],
    });

    this.addActivationHandler(this._activationHandler.bind(this));
  }

  private _activationHandler() {
    let cleanUp: (() => void) | undefined;

    // If we are the root scene context initialize URL sync
    if (!this.parent) {
      getUrlSyncManager().initSync(this);
      cleanUp = () => getUrlSyncManager().cleanUp(this);
    }

    return cleanUp;
  }

  public addToScene(obj: SceneObject) {
    this.setState({ children: [...this.state.children, obj] });
    writeSceneLog('SceneContext', `Adding to scene: ${obj.constructor.name} key: ${obj.state.key}`);

    const deactivate = obj.activate();

    return () => {
      writeSceneLog('SceneContext', `Removing from scene: ${obj.constructor.name} key: ${obj.state.key}`);
      this.setState({ children: this.state.children.filter((x) => x !== obj) });

      deactivate();
    };
  }

  public findByKey<T>(key: string): T | undefined {
    return this.state.children.find((x) => x.state.key === key) as T;
  }

  public findVariable<T>(name: string): T | undefined {
    const variables = this.state.$variables as SceneVariableSet;
    if (!variables) {
      return;
    }

    return variables.getByName(name) as T;
  }

  public addVariable(variable: SceneVariable) {
    let set = this.state.$variables as SceneVariableSet;

    if (set) {
      set.setState({ variables: [...set.state.variables, variable] });
    } else {
      set = new SceneVariableSet({ variables: [variable] });
      this.setState({ $variables: set });
    }

    writeSceneLog('SceneContext', `Adding variable: ${variable.constructor.name} key: ${variable.state.key}`);

    return () => {
      set.setState({ variables: set.state.variables.filter((x) => x !== variable) });
      writeSceneLog('SceneContext', `Removing variable: ${variable.constructor.name} key: ${variable.state.key}`);
    };
  }

  public findAnnotationLayer<T>(name: string): T | undefined {
      const layerSet = this.state.$data as SceneDataLayerSet;
      if (!layerSet) {
          return;
      }

      return layerSet.state.layers.find((layer: SceneDataLayerProvider) => layer.state.name === name) as T; 
  }

  public addAnnotationLayer(layer: SceneDataLayerProvider) {
      let layerSet = this.state.$data as SceneDataLayerSet;

      console.log(this);

      if (layerSet) {
          layerSet.setState({ layers: [...layerSet.state.layers, layer] });
      } else {
        layerSet = new SceneDataLayerSet({ layers: [layer] });
        this.setState({ $data: layerSet });
      }

      writeSceneLog('SceneContext', `Adding annotation data layer: ${layer.state.name} key: ${layer.state.key}`);

      return () => {
          layerSet.setState({ layers: layerSet.state.layers.filter((x) => x !== layer) });
          writeSceneLog('SceneContext', `Removing annotation data layer: ${layer.state.name} key: ${layer.state.key}`);
      }
  }
}
