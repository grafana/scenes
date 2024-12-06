import { Observable } from 'rxjs';
import { JsonVariableOptionProvider, JsonVariableOption } from './JsonVariable';
import { isObject } from 'lodash';

export interface JsonStringOptionProviderOptions {
  /**
   * String contauining JSON with an array of objects or a map of objects
   */
  json: string;
  /**
   * Defaults to name if not specified
   */
  valueProp?: string;
}

export class JsonStringOptionProvider implements JsonVariableOptionProvider {
  public constructor(private options: JsonStringOptionProviderOptions) {}

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

export interface ObjectArrayOptionProviderOptions {
  /**
   * String contauining JSON with an array of objects or a map of objects
   */
  options: unknown[];
  /**
   * Defaults to name if not specified
   */
  valueProp?: string;
}

export class ObjectArrayOptionProvider implements JsonVariableOptionProvider {
  public constructor(private options: ObjectArrayOptionProviderOptions) {}

  public getOptions(): Observable<JsonVariableOption[]> {
    return new Observable((subscriber) => {
      try {
        const { options, valueProp = 'name' } = this.options;

        const resultOptions: JsonVariableOption[] = [];

        options.forEach((option) => {
          if (typeof option !== 'object' || option == null) {
            return;
          }

          //@ts-ignore
          if (valueProp in option && option[valueProp] == null) {
            return;
          }

          resultOptions.push({
            //@ts-ignore
            value: option[valueProp],
            //@ts-ignore
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

export const JsonVariableOptionProviders = {
  fromString: (options: JsonStringOptionProviderOptions) => new JsonStringOptionProvider(options),
  fromObjectArray: (options: ObjectArrayOptionProviderOptions) => new ObjectArrayOptionProvider(options),
};
