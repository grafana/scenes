import { SceneObjectUrlSyncHandler, SceneObjectUrlValues } from '../../core/types';
import { GroupByVariable } from './GroupByVariable';
import { toUrlCommaDelimitedString, unescapeUrlDelimiters } from '../utils';
import { VariableValue } from '../types';

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

    return { [this.getKey()]: toUrlValues(this._sceneObject.state.value, this._sceneObject.state.text) };
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

      const { values, texts } = fromUrlValues(urlValue);

      this._sceneObject.changeValueTo(values, texts);
    }
  }
}

function toUrlValues(values: VariableValue, texts: VariableValue): string[] {
  values = Array.isArray(values) ? values : [values];
  texts = Array.isArray(texts) ? texts : [texts];

  return values.map((value, idx) => {
    if (value === undefined || value === null) {
      return '';
    }

    value = String(value);

    let text = texts[idx];
    text = text === undefined || text === null ? value : String(text);

    return toUrlCommaDelimitedString(value, text);
  });
}

function fromUrlValues(urlValues: string | string[]): { values: string[]; texts: string[] } {
  urlValues = Array.isArray(urlValues) ? urlValues : [urlValues];

  return urlValues.reduce<{ values: string[]; texts: string[] }>(
    (acc, urlValue) => {
      const [value, label] = (urlValue ?? '').split(',');

      acc.values.push(unescapeUrlDelimiters(value));
      acc.texts.push(unescapeUrlDelimiters(label ?? value));

      return acc;
    },
    {
      values: [],
      texts: [],
    }
  );
}
