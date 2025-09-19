import { v4 as uuidv4 } from 'uuid';
import { catchError, filter, from, mergeMap, Observable, of, take, throwError } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph';
import { VariableValueOption } from '../types';
import { CustomVariable } from './CustomVariable';
import { QueryVariable } from './query/QueryVariable';
import { CoreApp, DataQueryRequest, LoadingState, PanelData, ScopedVars } from '@grafana/data';
import { DataQuery } from '@grafana/schema';
import { registerQueryWithController } from '../../querying/registerQueryWithController';
import { getDataSource } from '../../utils/getDataSource';
import { wrapInSafeSerializableSceneObject } from '../../utils/wrapInSafeSerializableSceneObject';
import { createQueryVariableRunner } from './query/createQueryVariableRunner';
import { toMetricFindValues } from './query/toMetricFindValues';
import { metricNamesToVariableValues, sortVariableValues } from './query/utils';
import { MultiValueVariable, VariableGetOptionsArgs } from './MultiValueVariable';

type BuilderFunction = (variable: MultiValueVariable) => CustomOptionsProvider;

const OPTIONS_PROVIDERS_LOOKUP = new Map<string, BuilderFunction>([
  [
    'csv',
    (variable: MultiValueVariable) =>
      new CsvOptionsProvider({
        csv: sceneGraph.interpolate(variable, (variable as unknown as CustomVariable).state.query),
      }),
  ],
  [
    'json',
    (variable: MultiValueVariable) =>
      new JsonOptionsProvider({
        json: sceneGraph.interpolate(variable, (variable as unknown as CustomVariable).state.query),
        valueProp: (variable as unknown as CustomVariable).state.optionsProvider.valueProp,
        textProp: (variable as unknown as CustomVariable).state.optionsProvider.textProp,
      }),
  ],
  [
    'query',
    (variable: MultiValueVariable) =>
      new QueryOptionsProvider({
        variable: variable as unknown as QueryVariable, // TEMP, in the future, can we pass only minimal info?
      }),
  ],
]);

export function buildOptionsProvider(variable: MultiValueVariable) {
  const { optionsProvider } = variable.state;
  if (!optionsProvider) {
    throw new Error('Variable is missing optionsProvider');
  }
  if (OPTIONS_PROVIDERS_LOOKUP.has(optionsProvider.type)) {
    return OPTIONS_PROVIDERS_LOOKUP.get(optionsProvider.type)!(variable);
  }
  throw new Error(`Unknown options provider "${optionsProvider.type}"`);
}

export function registerOptionsProvider(type: string, builderFn: BuilderFunction) {
  if (OPTIONS_PROVIDERS_LOOKUP.has(type)) {
    throw new Error(`Options provider "${type}" already registered`);
  }
  OPTIONS_PROVIDERS_LOOKUP.set(type, builderFn);
}

export type OptionsProviderSettings = {
  type: string;
  /**
   * For object values, these settings control which properties will be used to get the text and the value of the current option
   */
  valueProp?: string;
  textProp?: string;
};

export interface CustomOptionsProvider {
  getOptions(args?: VariableGetOptionsArgs): Observable<VariableValueOption[]>;
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
      throw new Error('Variable is missing valueProp');
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

/* QUERY */

interface QueryProviderParams {
  variable: QueryVariable;
}

export class QueryOptionsProvider implements CustomOptionsProvider {
  public constructor(private params: QueryProviderParams) {}

  public getOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    const { variable } = this.params;
    const { datasource, optionsProvider, regex, sort, staticOptions, staticOptionsOrder } = variable.state;

    return from(getDataSource(datasource, { __sceneObject: wrapInSafeSerializableSceneObject(variable) })).pipe(
      mergeMap((ds) => {
        const runner = createQueryVariableRunner(ds);
        const target = runner.getTarget(variable);
        const request = this.getRequest(target, args.searchFilter);

        return runner.runRequest({ variable, searchFilter: args.searchFilter }, request).pipe(
          registerQueryWithController({
            type: 'QueryVariable/getValueOptions',
            request: request,
            origin: variable,
          }),
          filter((data) => data.state === LoadingState.Done || data.state === LoadingState.Error), // we only care about done or error for now
          take(1), // take the first result, using first caused a bug where it in some situations throw an uncaught error because of no results had been received yet
          mergeMap((data: PanelData) => {
            if (data.state === LoadingState.Error) {
              return throwError(() => data.error);
            }
            return of(data);
          }),
          toMetricFindValues(optionsProvider),
          mergeMap((values) => {
            let interpolatedRegex = '';
            if (regex) {
              interpolatedRegex = sceneGraph.interpolate(variable, regex, undefined, 'regex');
            }
            let options = metricNamesToVariableValues(interpolatedRegex, sort, values);
            if (staticOptions) {
              const customOptions = staticOptions;
              options = options.filter((option) => !customOptions.find((custom) => custom.value === option.value));
              if (staticOptionsOrder === 'after') {
                options.push(...customOptions);
              } else if (staticOptionsOrder === 'sorted') {
                options = sortVariableValues(options.concat(customOptions), sort);
              } else {
                options.unshift(...customOptions);
              }
            }
            return of(options);
          }),
          catchError((error) => {
            if (error.cancelled) {
              return of([]);
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  private getRequest(target: DataQuery | string, searchFilter?: string) {
    const { variable } = this.params;

    const scopedVars: ScopedVars = {
      __sceneObject: wrapInSafeSerializableSceneObject(variable),
    };

    if (searchFilter) {
      scopedVars.__searchFilter = { value: searchFilter, text: searchFilter };
    }

    const range = sceneGraph.getTimeRange(variable).state.value;

    const request: DataQueryRequest = {
      app: CoreApp.Dashboard,
      requestId: uuidv4(),
      timezone: '',
      range,
      interval: '',
      intervalMs: 0,
      // @ts-ignore
      targets: [target],
      scopedVars,
      startTime: Date.now(),
    };

    return request;
  }
}
