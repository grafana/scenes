import {
  SceneObjectBase,
  SceneObject,
  SceneObjectState,
  SceneDataLayerSet,
  SceneDataLayerProvider,
} from '@grafana/scenes';
import { writeSceneLog } from '../utils';

export interface AnnotationObjectState extends SceneObjectState {
  children: SceneObject[];
}

export class AnnotationObject extends SceneObjectBase<AnnotationObjectState> {
  public constructor(state?: Partial<AnnotationObjectState>) {
    super({
      ...state,
      children: state?.children ?? [],
    });

    // this.addActivationHandler(this._activationHandler.bind(this));
  }

  public addToScene(obj: SceneObject) {
    this.setState({ children: [...this.state.children, obj] });
    writeSceneLog('AnnotationObject', `Adding to object: ${obj.constructor.name} key: ${obj.state.key}`);

    const deactivate = obj.activate();

    return () => {
      writeSceneLog('AnnotationObject', `Removing from object: ${obj.constructor.name} key: ${obj.state.key}`);
      this.setState({ children: this.state.children.filter((x) => x !== obj) });

      deactivate();
    };
  }

  public findByKey<T>(key: string): T | undefined {
    return this.state.children.find((x) => x.state.key === key) as T;
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
