import { Observable } from 'rxjs';
import { VariableValueOption } from '../types';

export const CustomOptionsProviders = {
  fromCsv: (params: CsvProviderParams) => new CsvOptionsProvider(params),
  fromJson: (params: JsonProviderParams) => new JsonOptionsProvider(params),
};

interface CustomOptionsProvider {
  getOptions(): Observable<VariableValueOption[]>;
}

interface CsvProviderParams {
  csv: string;
}

export class CsvOptionsProvider implements CustomOptionsProvider {
  public constructor(private params: CsvProviderParams) {}

  public getOptions(): Observable<VariableValueOption[]> {
    return new Observable((subscriber) => {
      try {
        const match = this.params.csv.match(/(?:\\,|[^,])+/g) ?? [];

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

        subscriber.next(options);
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    });
  }
}

interface JsonProviderParams {
  json: string;
  valueProp?: string;
  textProp?: string;
}

export class JsonOptionsProvider implements CustomOptionsProvider {
  public constructor(private params: JsonProviderParams) {}

  private parseAndValidateJson(json: string): VariableValueOption[] {
    const parsedOptions = JSON.parse(json);

    if (!Array.isArray(parsedOptions)) {
      throw new Error('Query must be a JSON array');
    }

    let options = [];

    if (typeof parsedOptions[0] === 'string') {
      options = parsedOptions.map((value) => ({ label: value.trim(), value: value.trim() }));
    } else if (typeof parsedOptions[0] === 'object' && parsedOptions[0] !== null) {
      const { valueProp, textProp } = this.params;

      if (!valueProp) {
        throw new Error('valueProp must be set');
      }

      for (const o of parsedOptions as Array<Record<string, any>>) {
        if (o[valueProp] == null) {
          continue;
        }

        options.push({
          value: o[valueProp].trim(),
          label: o[textProp as any]?.trim(),
          properties: o,
        });
      }
    } else {
      throw new Error('Query must be a JSON array of strings or objects');
    }

    return options;
  }

  public getOptions(): Observable<VariableValueOption[]> {
    return new Observable((subscriber) => {
      try {
        subscriber.next(this.parseAndValidateJson(this.params.json));
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    });
  }
}
