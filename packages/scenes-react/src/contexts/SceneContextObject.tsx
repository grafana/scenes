import { SceneObjectBase, SceneObject, SceneObjectState, SceneVariable, SceneVariableSet } from '@grafana/scenes';
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

  private _activationHandler() {}

  public addToScene(obj: SceneObject) {
    this.setState({ children: [...this.state.children, obj] });
    writeSceneLog('SceneContext', `Adding to scene: ${obj.constructor.name} key: ${obj.state.key}`);
  }

  public removeFromScene(obj: SceneObject) {
    this.setState({ children: this.state.children.filter((x) => x !== obj) });
    writeSceneLog('SceneContext', `Removing from scene: ${obj.constructor.name} key: ${obj.state.key}`);
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
      this.setState({ $variables: new SceneVariableSet({ variables: [variable] }) });
    }

    writeSceneLog('SceneContext', `Adding variable: ${variable.constructor.name} key: ${variable.state.key}`);
  }

  public removeVariable(variable: SceneVariable) {
    let set = this.state.$variables as SceneVariableSet;
    if (set) {
      set.setState({ variables: set.state.variables.filter((x) => x !== variable) });
      writeSceneLog('SceneContext', `Removing variable: ${variable.constructor.name} key: ${variable.state.key}`);
    }
  }
}
