import { SceneObjectUrlSyncHandler, SceneObjectUrlValues } from '../../core/types';
import { GroupByVariable } from './GroupByVariable';
import { escapeUrlPipeDelimiters, toUrlCommaDelimitedString, unescapeUrlDelimiters } from '../utils';
import { VariableValue } from '../types';
import { isEqual } from 'lodash';

export class GroupByVariableUrlSyncHandler implements SceneObjectUrlSyncHandler {
  public constructor(private _sceneObject: GroupByVariable) {}

  protected _nextChangeShouldAddHistoryStep = false;

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

    return {
      [this.getKey()]: toUrlValues(
        this._sceneObject.state.value,
        this._sceneObject.state.text,
        this._sceneObject.state.defaultValues?.value
      ),
    };
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

      const { values, texts, defaults } = fromUrlValues(urlValue);

      // if we only have defaults in our value set then the variable
      // is unmodified, meaning when we change dashboards we apply the default
      // values of the new dashboard instead of carrying these ones with us.
      // If there are also other values, then the variable is modified and we
      // do want to carry them all across
      if (isEqual(values, defaults) && this._sceneObject.state.defaultValues) {
        this._sceneObject.changeValueTo(
          this._sceneObject.state.defaultValues?.value,
          this._sceneObject.state.defaultValues?.text,
          false
        );
        return;
      }

      this._sceneObject.changeValueTo(values, texts);
    } else {
      if (this._sceneObject.state.defaultValues) {
        this._sceneObject.changeValueTo(
          this._sceneObject.state.defaultValues?.value,
          this._sceneObject.state.defaultValues?.text,
          false
        );
      }
    }
  }

  public performBrowserHistoryAction(callback: () => void) {
    this._nextChangeShouldAddHistoryStep = true;
    callback();
    this._nextChangeShouldAddHistoryStep = false;
  }

  public shouldCreateHistoryStep(values: SceneObjectUrlValues): boolean {
    return this._nextChangeShouldAddHistoryStep;
  }
}

function toUrlValues(values: VariableValue, texts: VariableValue, defaultValues?: VariableValue): string[] {
  values = Array.isArray(values) ? values : [values];
  texts = Array.isArray(texts) ? texts : [texts];
  const defaults = defaultValues ? (Array.isArray(defaultValues) ? defaultValues : [defaultValues]) : [];

  return values.map((value, idx) => {
    if (value === undefined || value === null) {
      return '';
    }

    value = String(value);

    let text = texts[idx];
    text = text === undefined || text === null ? value : String(text);

    return (
      toUrlCommaDelimitedString(value, text) + (defaults.includes(value) ? escapeUrlPipeDelimiters('|default') : '')
    );
  });
}

function fromUrlValues(urlValues: string | string[]): { values: string[]; texts: string[]; defaults: string[] } {
  urlValues = Array.isArray(urlValues) ? urlValues : [urlValues];

  return urlValues.reduce<{ values: string[]; texts: string[]; defaults: string[] }>(
    (acc, urlValue) => {
      const pipeEscapedVal = /__gfp__/g[Symbol.replace](urlValue, '|');
      const [commaValues, isDefault] = (pipeEscapedVal ?? '').split('|');
      const [value, label] = (commaValues ?? '').split(',');

      acc.values.push(unescapeUrlDelimiters(value));
      acc.texts.push(unescapeUrlDelimiters(label ?? value));

      if (isDefault) {
        acc.defaults.push(value);
      }

      return acc;
    },
    {
      values: [],
      texts: [],
      defaults: [],
    }
  );
}
