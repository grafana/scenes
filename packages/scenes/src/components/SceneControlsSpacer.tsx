import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps } from '../core/types';

export class SceneControlsSpacer extends SceneObjectBase {
  public constructor() {
    super({});

    this._renderBeforeActivation = true;
  }

  public static Component = (_props: SceneComponentProps<SceneControlsSpacer>) => {
    return <div style={{ flexGrow: 1 }} />;
  };
}
