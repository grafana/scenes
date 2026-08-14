import { interpolate } from '../core/sceneGraph/sceneGraph';
import type { AdHocFiltersVariable } from './adhoc/AdHocFiltersVariable';
import type { GroupByVariable } from './groupby/GroupByVariable';

/**
 * Whether a drilldown variable should be applied to queries for the given datasource UID.
 *
 * Two conditions, and both are easy to forget in isolation:
 *
 * - The datasource must match, comparing interpolated UIDs so datasource variables resolve.
 * - applyMode must not be 'manual'. Manual means the variable's owner applies it itself — as a
 *   `${var}` in a query expression or programmatically — so applying it here as well would
 *   double-apply it, onto queries that may not even carry the filtered labels.
 *
 * Applied once, where every discovery path converges in DrilldownDependenciesManager, rather than in
 * each finder. The finders are free to match on datasource alone; nothing they return reaches a query
 * request without passing through here.
 */
export function appliesAutomaticallyToDatasource(
  variable: AdHocFiltersVariable | GroupByVariable,
  dsUid: string | undefined
): boolean {
  return variable.state.applyMode !== 'manual' && interpolate(variable, variable.state.datasource?.uid) === dsUid;
}
