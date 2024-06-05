import { isEqual } from 'lodash';
import { VariableValue } from './types';
import { AdHocVariableFilter } from '@grafana/data';
import { sceneGraph } from '../core/sceneGraph';
import { SceneDataQuery, SceneObject, SceneObjectState } from '../core/types';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { DataSourceRef } from '@grafana/schema';

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

  if (filter.operator === '=~' || filter.operator === '!~¨') {
    value = escapeLabelValueInRegexSelector(filter.value);
  } else {
    value = escapeLabelValueInExactSelector(filter.value);
  }

  return `${filter.key}${filter.operator}"${value}"`;
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

  const applicableRunners = filterOutInactiveRunnerDuplicates(runners).filter((r) => {
    return r.state.datasource?.uid === sourceObject.state.datasource?.uid;
  });

  if (applicableRunners.length === 0) {
    return [];
  }

  const result: SceneDataQuery[] = [];
  applicableRunners.forEach((r) => {
    result.push(...r.state.queries);
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

export function unescapeUrlDelimiters(value: string | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  value = /__gfp__/g[Symbol.replace](value, '|');
  value = /__gfc__/g[Symbol.replace](value, ',');

  return value;
}

export function toUrlCommaDelimitedString(key: string, label?: string): string {
  // Omit for identical key/label or when label is not set at all
  if (!label || key === label) {
    return escapeUrlCommaDelimiters(key);
  }

  return [key, label].map(escapeUrlCommaDelimiters).join(',');
}
