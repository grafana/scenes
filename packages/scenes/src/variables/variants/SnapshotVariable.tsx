import { Observable, of, map } from 'rxjs';

import { SceneComponentProps } from '../../core/types';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { renderSelectForVariable } from '../components/VariableValueSelect';
import { VariableValueOption, ValidateAndUpdateResult } from '../types';

import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from './MultiValueVariable';
import { sceneGraph } from '../../core/sceneGraph';

export interface SnapshotVariableState extends MultiValueVariableState {
  query: string;
  isReadOnly: boolean;
}

export class SnapshotVariable extends MultiValueVariable<SnapshotVariableState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['query'],
  });

  public constructor(initialState: Partial<SnapshotVariableState>) {
    //TODO: Add new `snapshot` type to Variable Type
    super({
      type: 'custom',
      isReadOnly: true,
      query: '',
      value: '',
      text: '',
      options: [],
      name: '',
      ...initialState,
    });
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    const interpolated = sceneGraph.interpolate(this, this.state.query);
    const match = interpolated.match(/(?:\\,|[^,])+/g) ?? [];

    const options = match.map((text) => {
      text = text.replace(/\\,/g, ',');
      const textMatch = /^(.+)\s:\s(.+)$/g.exec(text) ?? [];
      if (textMatch.length === 3) {
        const [, key, value] = textMatch;
        return { label: key.trim(), value: value.trim() };
      } else {
        return { label: text.trim(), value: text.trim() };
      }
    });

    return of(options);
  }

  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    return this.getValueOptions({}).pipe(
      map((options) => {
        this._updateValueGivenNewOptions(options);
        return {};
      })
    );
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return renderSelectForVariable(model);
  };
  // we will always preserve the current value and text for snapshots
  private _updateValueGivenNewOptions(options: VariableValueOption[]) {
    const { value: currentValue, text: currentText } = this.state;

    const stateUpdate: Partial<MultiValueVariableState> = {
      options,
      loading: false,
      value: currentValue ?? [],
      text: currentText ?? [],
    };

    this.setState(stateUpdate);
  }
}
