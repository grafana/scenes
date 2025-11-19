import { isEqual } from 'lodash';
import { VariableValue } from './types';
import {
  AdHocVariableFilter,
  DataQueryError,
  GetTagResponse,
  GrafanaTheme2,
  MetricFindValue,
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  SelectableValue,
} from '@grafana/data';
import { sceneGraph } from '../core/sceneGraph';
import { SceneDataQuery, SceneObject, SceneObjectState } from '../core/types';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { DataSourceRef } from '@grafana/schema';
import { css } from '@emotion/css';
import { getDataSource } from '../utils/getDataSource';
import { wrapInSafeSerializableSceneObject } from '../utils/wrapInSafeSerializableSceneObject';
import { AdHocFiltersVariable } from './adhoc/AdHocFiltersVariable';
import { GroupByVariable } from './groupby/GroupByVariable';

export function isVariableValueEqual(a: VariableValue | null | undefined, b: VariableValue | null | undefined) {
  if (a === b) {
    return true;
  }

  return isEqual(a, b);
}

export function safeStringifyValue(value: unknown) {
  // Avoid circular references ignoring those references
  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (_: string, value: object | null) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };

  try {
    return JSON.stringify(value, getCircularReplacer());
  } catch (error) {
    console.error(error);
  }

  return '';
}

export function renderPrometheusLabelFilters(filters: AdHocVariableFilter[]) {
  return filters.map((filter) => renderFilter(filter)).join(',');
}

function renderFilter(filter: AdHocVariableFilter) {
  let value = '';
  let operator = filter.operator;

  // map "one of" operator to regex
  if (operator === '=|') {
    operator = '=~';
    // TODO remove when we're on the latest version of @grafana/data
    // @ts-expect-error
    value = filter.values?.map(escapeLabelValueInRegexSelector).join('|');
  } else if (operator === '!=|') {
    operator = '!~';
    // TODO remove when we're on the latest version of @grafana/data
    // @ts-expect-error
    value = filter.values?.map(escapeLabelValueInRegexSelector).join('|');
  } else if (operator === '=~' || operator === '!~') {
    value = escapeLabelValueInRegexSelector(filter.value);
  } else {
    value = escapeLabelValueInExactSelector(filter.value);
  }

  return `${filter.key}${operator}"${value}"`;
}

// based on the openmetrics-documentation, the 3 symbols we have to handle are:
// - \n ... the newline character
// - \  ... the backslash character
// - "  ... the double-quote character
export function escapeLabelValueInExactSelector(labelValue: string): string {
  return labelValue.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

export function escapeLabelValueInRegexSelector(labelValue: string): string {
  return escapeLabelValueInExactSelector(escapeLokiRegexp(labelValue));
}

export function isRegexSelector(selector?: string) {
  if (selector && (selector.includes('=~') || selector.includes('!~'))) {
    return true;
  }
  return false;
}

// Loki regular-expressions use the RE2 syntax (https://github.com/google/re2/wiki/Syntax),
// so every character that matches something in that list has to be escaped.
// the list of meta characters is: *+?()|\.[]{}^$
// we make a javascript regular expression that matches those characters:
const RE2_METACHARACTERS = /[*+?()|\\.\[\]{}^$]/g;
function escapeLokiRegexp(value: string): string {
  return value.replace(RE2_METACHARACTERS, '\\$&');
}

/**
 * Get all queries in the scene that have the same datasource as provided source object
 */
export function getQueriesForVariables(
  sourceObject: SceneObject<SceneObjectState & { datasource: DataSourceRef | null }>
) {
  const runners = sceneGraph.findAllObjects(
    sourceObject.getRoot(),
    (o) => o instanceof SceneQueryRunner
  ) as SceneQueryRunner[];

  const interpolatedDsUuid = sceneGraph.interpolate(sourceObject, sourceObject.state.datasource?.uid);

  const applicableRunners = filterOutInactiveRunnerDuplicates(runners).filter((r) => {
    const interpolatedQueryDsUuid = sceneGraph.interpolate(sourceObject, r.state.datasource?.uid);

    return interpolatedQueryDsUuid === interpolatedDsUuid;
  });

  if (applicableRunners.length === 0) {
    return [];
  }

  const result: SceneDataQuery[] = [];
  applicableRunners.forEach((r) => {
    result.push(
      ...r.state.queries.filter((q) => {
        if (!q.datasource || !q.datasource.uid) {
          return true;
        }

        const interpolatedQueryDsUuid = sceneGraph.interpolate(sourceObject, q.datasource.uid);
        return interpolatedQueryDsUuid === interpolatedDsUuid;
      })
    );
  });

  return result;
}

// Filters out inactive runner duplicates, keeping only the ones that are currently active.
// This is needed for scnearios whan a query runner is cloned and the original is not removed but de-activated.
// Can happen i.e. when editing a panel in Grafana Core dashboards.
function filterOutInactiveRunnerDuplicates(runners: SceneQueryRunner[]) {
  // Group items by key
  const groupedItems: { [key: string]: SceneQueryRunner[] } = {};

  for (const item of runners) {
    if (item.state.key) {
      if (!(item.state.key in groupedItems)) {
        groupedItems[item.state.key] = [];
      }
      groupedItems[item.state.key].push(item);
    }
  }

  // Filter out inactive items and concatenate active items
  return Object.values(groupedItems).flatMap((group) => {
    const activeItems = group.filter((item) => item.isActive);
    // Keep inactive items if there's only one item with the key
    if (activeItems.length === 0 && group.length === 1) {
      return group;
    }
    return activeItems;
  });
}

export function escapeUrlPipeDelimiters(value: string | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Replace the pipe due to using it as a filter separator
  return (value = /\|/g[Symbol.replace](value, '__gfp__'));
}

export function escapeUrlCommaDelimiters(value: string | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Replace the comma due to using it as a value/label separator
  return /,/g[Symbol.replace](value, '__gfc__');
}

export function escapeUrlHashDelimiters(value: string | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Replace the hash due to using it as a value/label separator
  return /#/g[Symbol.replace](value, '__gfh__');
}

export function escapeOriginFilterUrlDelimiters(value: string | undefined): string {
  return escapeUrlHashDelimiters(escapeUrlPipeDelimiters(value));
}

export function escapeURLDelimiters(value: string | undefined): string {
  return escapeUrlCommaDelimiters(escapeUrlPipeDelimiters(value));
}

export function unescapeUrlDelimiters(value: string | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  value = /__gfp__/g[Symbol.replace](value, '|');
  value = /__gfc__/g[Symbol.replace](value, ',');
  value = /__gfh__/g[Symbol.replace](value, '#');

  return value;
}

export function toUrlCommaDelimitedString(key: string, label?: string): string {
  // Omit for identical key/label or when label is not set at all
  if (!label || key === label) {
    return escapeUrlCommaDelimiters(key);
  }

  return [key, label].map(escapeUrlCommaDelimiters).join(',');
}

export function dataFromResponse(response: GetTagResponse | MetricFindValue[]) {
  return Array.isArray(response) ? response : response.data;
}

export function responseHasError(
  response: GetTagResponse | MetricFindValue[]
): response is GetTagResponse & { error: DataQueryError } {
  return !Array.isArray(response) && Boolean(response.error);
}

// Collect a flat list of SelectableValues with a `group` property into a hierarchical list with groups
export function handleOptionGroups(values: SelectableValue[]): Array<SelectableValue<string>> {
  const result: Array<SelectableValue<string>> = [];
  const groupedResults = new Map<string, Array<SelectableValue<string>>>();

  for (const value of values) {
    const groupLabel = value.group;
    if (groupLabel) {
      let group = groupedResults.get(groupLabel);

      if (!group) {
        group = [];
        groupedResults.set(groupLabel, group);
        result.push({ label: groupLabel, options: group });
      }

      group.push(value);
    } else {
      result.push(value);
    }
  }

  return result;
}

export function getNonApplicablePillStyles(theme: GrafanaTheme2) {
  return {
    disabledPill: css({
      background: theme.colors.action.selected,
      color: theme.colors.text.disabled,
      border: 0,
      '&:hover': {
        background: theme.colors.action.selected,
      },
    }),
    strikethrough: css({
      textDecoration: 'line-through',
    }),
  };
}

export function verifyDrilldownApplicability(
  sourceObject: SceneObject,
  queriesDataSource: DataSourceRef | undefined,
  drilldownDatasource: DataSourceRef | null,
  isApplicabilityEnabled?: boolean
): boolean {
  const datasourceUid = sceneGraph.interpolate(sourceObject, queriesDataSource?.uid);

  return Boolean(
    isApplicabilityEnabled && datasourceUid === sceneGraph.interpolate(sourceObject, drilldownDatasource?.uid)
  );
}

export async function getDrilldownApplicability(
  queryRunner: SceneQueryRunner,
  filtersVar?: AdHocFiltersVariable,
  groupByVar?: GroupByVariable
): Promise<DrilldownsApplicability[] | undefined> {
  //if no drilldown vars return
  if (!filtersVar && !groupByVar) {
    return;
  }

  const datasource = queryRunner.state.datasource;
  const queries = queryRunner.state.data?.request?.targets;

  const ds = await getDataSource(datasource, {
    __sceneObject: wrapInSafeSerializableSceneObject(queryRunner),
  });

  // return if method not implemented
  // @ts-expect-error (temporary till we update grafana/data)
  if (!ds.getDrilldownsApplicability) {
    return;
  }

  const dsUid = sceneGraph.interpolate(queryRunner, datasource?.uid);
  const timeRange = sceneGraph.getTimeRange(queryRunner).state.value;
  const groupByKeys = [];
  const filters = [];

  const hasGroupByApplicability =
    groupByVar && dsUid === sceneGraph.interpolate(groupByVar, groupByVar?.state.datasource?.uid);
  const hasFiltersApplicability =
    filtersVar && dsUid === sceneGraph.interpolate(filtersVar, filtersVar.state?.datasource?.uid);

  // if neither vars use the ds from the queries, return
  if (!hasGroupByApplicability && !hasFiltersApplicability) {
    return;
  }

  if (hasGroupByApplicability) {
    groupByKeys.push(
      ...(Array.isArray(groupByVar.state.value)
        ? groupByVar.state.value.map((v) => String(v))
        : groupByVar.state.value
        ? [String(groupByVar.state.value)]
        : [])
    );
  }

  if (hasFiltersApplicability) {
    filters.push(...filtersVar.state.filters, ...(filtersVar.state.originFilters ?? []));
  }

  // @ts-expect-error (temporary till we update grafana/data)
  return await ds.getDrilldownsApplicability({
    groupByKeys,
    filters,
    queries,
    timeRange,
    scopes: sceneGraph.getScopes(queryRunner),
  });
}
