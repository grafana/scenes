import { Observable } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph';
import { VariableValueOption } from '../types';
import { CustomVariable } from './CustomVariable';

type BuilderFunction = (variable: CustomVariable) => CustomOptionsProvider;

const optionsProvidersLookup = new Map<string, BuilderFunction>([
  [
    'csv',
    (variable: CustomVariable) =>
      new CsvOptionsProvider({
        csv: sceneGraph.interpolate(variable, variable.state.query),
      }),
  ],
  [
    'json',
    (variable: CustomVariable) => {
      return new JsonOptionsProvider({
        json: sceneGraph.interpolate(variable, variable.state.query),
        valueProp: variable.state.valueProp,
        textProp: variable.state.textProp,
      });
    },
  ],
]);

export function buildOptionsProvider(variable: CustomVariable) {
  const { optionsProviderType } = variable.state;
  if (optionsProvidersLookup.has(optionsProviderType)) {
    return optionsProvidersLookup.get(optionsProviderType)!(variable);
  }
  throw new Error(`Unknown options provider "${optionsProviderType}"`);
}

export function registerOptionsProvider(type: string, builderFn: BuilderFunction) {
  if (optionsProvidersLookup.has(type)) {
    throw new Error(`Options provider "${type}" already registered`);
  }
  optionsProvidersLookup.set(type, builderFn);
}

export interface CustomOptionsProvider {
  getOptions(): Observable<VariableValueOption[]>;
}

/* CSV */

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

/* JSON */

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

    if (typeof parsedOptions[0] === 'string') {
      return parsedOptions.map((value) => ({ label: value.trim(), value: value.trim() }));
    }

    if (typeof parsedOptions[0] !== 'object' || parsedOptions[0] === null) {
      throw new Error('Query must be a JSON array of strings or objects');
    }

    const { valueProp, textProp } = this.params;

    if (!valueProp) {
      throw new Error('Missing valueProp');
    }

    return parsedOptions.map((o) => ({
      value: String(o[valueProp]).trim(),
      label: String(o[textProp as any] || o[valueProp])?.trim(),
      properties: o,
    }));
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
