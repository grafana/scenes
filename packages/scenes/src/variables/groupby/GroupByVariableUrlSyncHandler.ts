import { unzip, zip } from 'lodash';
import { SceneObjectUrlSyncHandler, SceneObjectUrlValues } from '../../core/types';
import { GroupByVariable } from './GroupByVariable';
import { toUrlCommaDelimitedString, unescapeUrlDelimiters } from '../utils';
import { VariableValueSingle } from '../types';

export class GroupByVariableUrlSyncHandler implements SceneObjectUrlSyncHandler {
  public constructor(private _sceneObject: GroupByVariable) {}

  private getKey(): string {
    return `var-${this._sceneObject.state.name}`;
  }

  public getKeys(): string[] {
    if (this._sceneObject.state.skipUrlSync) {
      return [];
    }

    return [this.getKey()];
  }

  public getUrlState(): SceneObjectUrlValues {
    if (this._sceneObject.state.skipUrlSync) {
      return {};
    }

    let { value: values, text: texts } = this._sceneObject.state;

    values = Array.isArray(values) ? values : [values];
    texts = Array.isArray(texts) ? texts : [texts];

    const urlValue = zip(values, texts).map(toUrlValues);

    return { [this.getKey()]: urlValue };
  }

  public updateFromUrl(values: SceneObjectUrlValues): void {
    let urlValue = values[this.getKey()];

    if (urlValue != null) {
      /**
       * Initial URL Sync happens before scene objects are activated.
       * We need to skip validation in this case to make sure values set via URL are maintained.
       */
      if (!this._sceneObject.isActive) {
        this._sceneObject.skipNextValidation = true;
      }

      urlValue = Array.isArray(urlValue) ? urlValue : [urlValue];
      const valuesLabelsPairs = urlValue.map((value) => (value ? value.split(',') : [value]));
      let [values, labels] = unzip(valuesLabelsPairs);

      values = (values ?? []).map(unescapeUrlDelimiters);
      labels = (labels ?? []).map(unescapeUrlDelimiters);

      this._sceneObject.setState({
        urlOptions: values.map((value, idx) => ({
          value,
          text: labels[idx],
        })),
      });

      this._sceneObject.changeValueTo(values, labels);
    }
  }
}

function toUrlValues([value, label]: [VariableValueSingle | undefined, VariableValueSingle | undefined]): string {
  if (value === undefined || value === null) {
    return '';
  }

  value = String(value);
  label = label === undefined || label === null ? value : String(label);

  return toUrlCommaDelimitedString(value, label);
}
