import {
  SceneObjectBase,
  SceneObject,
  SceneObjectState,
  SceneVariable,
  SceneVariableSet,
  NewSceneObjectAddedEvent,
} from '@grafana/scenes';
import { writeSceneLog } from '../utils';

export interface SceneContextObjectState extends SceneObjectState {
  childContexts?: SceneContextObject[];
  children: SceneObject[];
}

export class SceneContextObject extends SceneObjectBase<SceneContextObjectState> {
  public constructor(state?: Partial<SceneContextObjectState>) {
    super({
      ...state,
      children: state?.children ?? [],
      childContexts: state?.childContexts ?? [],
    });
  }

  public addToScene(obj: SceneObject) {
    this.publishEvent(new NewSceneObjectAddedEvent(obj), true);

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

    this.publishEvent(new NewSceneObjectAddedEvent(variable), true);

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

  public addChildContext(ctx: SceneContextObject) {
    this.publishEvent(new NewSceneObjectAddedEvent(ctx), true);

    this.setState({ childContexts: [...(this.state.childContexts ?? []), ctx] });

    writeSceneLog('SceneContext', `Adding child context: ${ctx.constructor.name} key: ${ctx.state.key}`);
  }

  public removeChildContext(ctx: SceneContextObject) {
    this.setState({
      childContexts: this.state.childContexts?.filter((context) => ctx !== context),
    });

    writeSceneLog('SceneContext', `Remvoing child context: ${ctx.constructor.name} key: ${ctx.state.key}`);
  }
}
