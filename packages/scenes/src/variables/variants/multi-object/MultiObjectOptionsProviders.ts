import { Observable } from 'rxjs';
import { MultiObjectVariableOption, MultiObjectOptionsProvider } from './MultiObjectVariable';

interface JsonProviderParams {
  /**
   * String containing JSON with an array of objects
   */
  json: string;
  /**
   * Defaults to id if not specified
   */
  valueProp?: string;
  /**
   * Defaults to name if not specified
   */
  textProp?: string;
}

export class JsonOptionsProvider implements MultiObjectOptionsProvider {
  public constructor(private params: JsonProviderParams) {}

  private static parseAndValidateJson(json: string) {
    const jsonValue = JSON.parse(json);

    if (!Array.isArray(jsonValue)) {
      throw new TypeError('The JSON provided must be an array');
    }

    for (const item of jsonValue) {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        throw new TypeError(`The JSON provided must be an array of objects`);
      }
    }

    return jsonValue;
  }

  public getOptions(): Observable<MultiObjectVariableOption[]> {
    return new Observable((subscriber) => {
      try {
        const { json, valueProp = 'id', textProp = 'name' } = this.params;

        const jsonValue = JsonOptionsProvider.parseAndValidateJson(json);

        const resultOptions: MultiObjectVariableOption[] = [];

        jsonValue.forEach((option) => {
          if (option[valueProp] == null) {
            return;
          }

          resultOptions.push({
            value: String(option[valueProp]),
            label: String(option[textProp]),
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

export const MultiObjectOptionsProviders = {
  fromJson: (params: JsonProviderParams) => new JsonOptionsProvider(params),
};
