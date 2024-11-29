import { VariableHide } from '@grafana/schema';
import { Observable } from 'rxjs';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps } from '../../core/types';
import { SceneVariable, SceneVariableState, ValidateAndUpdateResult, VariableValue } from '../types';

export interface InitSceneVariableState extends SceneVariableState {}

export class InitSceneVariable
  extends SceneObjectBase<InitSceneVariableState>
  implements SceneVariable<InitSceneVariableState>
{
  public constructor(state: Partial<InitSceneVariableState>) {
    super({
      //@ts-ignore
      type: 'init',
      hide: VariableHide.hideVariable,
    });
  }

  public getValue(): VariableValue {
    return '';
  }

  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    return new Observable((subscriber) => {
      subscriber.next({});
      subscriber.complete();
    });
  }

  public static Component = ({ model }: SceneComponentProps<InitSceneVariableState>) => {
    return null;
  };
}
