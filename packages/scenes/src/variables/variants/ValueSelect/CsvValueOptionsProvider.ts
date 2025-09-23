import { Observable, of } from 'rxjs';
import { SceneVariable, SceneVariableState, VariableValueOption } from '../../types';
import { VariableGetOptionsArgs } from '../MultiValueVariable';
import { VariableValueOptionsProvider } from './types';
import { sceneGraph } from '../../../core/sceneGraph';

export class CsvValueOptionsProvider implements VariableValueOptionsProvider {
  public constructor(public csvString: string) {}

  public getValueOptions(
    variable: SceneVariable<SceneVariableState>,
    args: VariableGetOptionsArgs
  ): Observable<VariableValueOption[]> {
    const interpolated = sceneGraph.interpolate(variable, this.csvString);
    const match = interpolated.match(/(?:\\,|[^,])+/g) ?? [];

    const options = match.map((text) => {
      text = text.replace(/\\,/g, ',');
      const textMatch = /^\s*(.+)\s:\s(.+)$/g.exec(text) ?? [];
      if (textMatch.length === 3) {
        const [, key, value] = textMatch;
        return { label: key.trim(), value: value.trim() };
      } else {
        return { label: text.trim(), value: text.trim() };
      }
    });

    return of(options);
  }
}
