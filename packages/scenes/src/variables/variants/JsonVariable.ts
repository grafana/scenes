import { property } from 'lodash';
import { Observable, map, of } from 'rxjs';

import {
  SceneObjectBase,
  SceneVariable,
  SceneVariableState,
  ValidateAndUpdateResult,
  VariableValue,
} from '@grafana/scenes';

export interface JsonVariableState extends SceneVariableState {
  /**
   * The current value
   */
  value?: string;
  /**
   * O
   */
  options: JsonVariableOption[];
  /**
   * The thing that generates/returns possible values / options
   */
  provider?: JsonVariableOptionProvider;
}

export interface JsonVariableOption {
  value: string;
  label: string;
  obj: unknown;
}

export interface JsonVariableOptionProvider {
  getOptions(): Observable<JsonVariableOption[]>;
}

export class JsonVariable extends SceneObjectBase<JsonVariableState> implements SceneVariable {
  public constructor(state: Partial<JsonVariableState>) {
    super({
      // @ts-ignore
      type: 'json',
      ...state,
    });
  }

  private static fieldAccessorCache: FieldAccessorCache = {};

  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    if (!this.state.provider) {
      return of({});
    }

    return this.state.provider.getOptions().pipe(
      map((options) => {
        console.log('options', options);
        this.updateValueGivenNewOptions(options);
        return {};
      })
    );
  }

  private updateValueGivenNewOptions(options: JsonVariableOption[]) {
    if (!this.state.value) {
      return;
    }

    const stateUpdate: Partial<JsonVariableState> = { options };

    const found = options.find((option) => option.value === this.state.value);

    if (!found) {
      if (options.length > 0) {
        stateUpdate.value = options[0].value;
      } else {
        stateUpdate.value = undefined;
      }
    }

    this.setState(stateUpdate);
  }

  public getValueText?(fieldPath?: string): string {
    const current = this.state.options.find((option) => option.value === this.state.value);
    return current ? current.label : '';
  }

  public getValue(fieldPath: string): VariableValue {
    const current = this.state.options.find((option) => option.value === this.state.value);
    return current ? this.getFieldAccessor(fieldPath)(current.obj) : '';
  }

  private getFieldAccessor(fieldPath: string) {
    const accessor = JsonVariable.fieldAccessorCache[fieldPath];
    if (accessor) {
      return accessor;
    }

    return (JsonVariable.fieldAccessorCache[fieldPath] = property(fieldPath));
  }
}

interface FieldAccessorCache {
  [key: string]: (obj: any) => any;
}

export interface JsonStringOptionPrividerOptions {
  /**
   * String contauining JSON with an array of objects or a map of objects
   */
  json: string;
  /**
   * Defaults to name if not specified
   */
  valueProp?: string;
}

export class JsonStringOptionPrivider implements JsonVariableOptionProvider {
  public constructor(private options: JsonStringOptionPrividerOptions) {}

  public getOptions(): Observable<JsonVariableOption[]> {
    return new Observable((subscriber) => {
      try {
        const { json, valueProp = 'name' } = this.options;
        const jsonValue = JSON.parse(json);

        if (!Array.isArray(jsonValue)) {
          throw new Error('JSON must be an array');
        }

        const resultOptions: JsonVariableOption[] = [];

        jsonValue.forEach((option) => {
          if (option[valueProp] == null) {
            return;
          }

          resultOptions.push({
            value: option[valueProp],
            label: option[valueProp],
            obj: option,
          });
        });

        subscriber.next(resultOptions);
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    });
  }
}
