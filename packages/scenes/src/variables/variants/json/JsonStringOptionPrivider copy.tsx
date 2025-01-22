import { Observable } from 'rxjs';
import { JsonVariableOptionProvider, JsonVariableOption } from './JsonVariable';

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
