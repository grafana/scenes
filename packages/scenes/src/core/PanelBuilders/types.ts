import { FieldConfig, FieldConfigSource } from '@grafana/data';
import { MatcherConfig } from '@grafana/schema';
import { DeepPartial } from '../types';

export type StandardFieldConfigInterface<T, C, Prefix extends string> = {
  [K in keyof T as `${Prefix}${Capitalize<string & K>}`]: (value: T[K]) => C;
} & {
  [K in Exclude<keyof T, keyof any[]> as `${Prefix}${Capitalize<string & K>}`]: (value: T[K]) => C;
};

export type PropertySetter<T> = <K extends keyof T>(id: K, value: T[K]) => PropertySetter<T>;
export type OverridesSetter<T> = (matcher: MatcherConfig) => PropertySetter<T>;
export type OverridesBuilder<T> = (builder: OverridesSetter<T>) => void;

export type StandardFieldConfig = Pick<
  FieldConfig,
  | 'color'
  | 'decimals'
  | 'displayName'
  | 'filterable'
  | 'links'
  | 'mappings'
  | 'max'
  | 'min'
  | 'noValue'
  | 'thresholds'
  | 'unit'
>;
export interface VizConfig<TOptions = {}, TFieldConfig = {}> {
  pluginId: string;
  pluginVersion: string;
  options: DeepPartial<TOptions>;
  fieldConfig: FieldConfigSource<DeepPartial<TFieldConfig>>;
}
