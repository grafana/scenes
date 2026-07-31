/**
 * Demo for the "All" option offered on dashboard default (origin) filters using the "one of"
 * operator. Keys and values come from providers rather than a real datasource, so the page works
 * against whatever datasource happens to be provisioned under the uid below.
 */
import React from 'react';
import { GrafanaTheme2, MetricFindValue } from '@grafana/data';
import {
  AdHocFilterWithLabels,
  AdHocFiltersVariable,
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneObjectRef,
  SceneObjectState,
  SceneQueryRunner,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

const DS = { uid: 'gdev-prometheus' };

const TAG_KEYS = ['region', 'service', 'env'];

const TAG_VALUES: Record<string, string[]> = {
  region: ['AMER', 'APAC', 'EMEA', 'LATAM'],
  service: ['checkout', 'payments', 'search'],
  env: ['dev', 'prod', 'staging'],
};

const toMetricFindValues = (values: string[]): MetricFindValue[] => values.map((text) => ({ text }));

function getFiltersVariable(originFilters: AdHocFilterWithLabels[]) {
  return new AdHocFiltersVariable({
    name: 'Filters',
    label: 'Filters',
    layout: 'combobox',
    applyMode: 'auto',
    supportsMultiValueOperators: true,
    datasource: DS,
    originFilters,
    filters: [{ key: 'service', operator: '=|', value: 'checkout', values: ['checkout'], condition: '' }],
    getTagKeysProvider: async () => ({ replace: true, values: toMetricFindValues(TAG_KEYS) }),
    getTagValuesProvider: async (_variable, filter) => ({
      replace: true,
      values: toMetricFindValues(TAG_VALUES[filter.key] ?? []),
    }),
  });
}

function getScene(originFilters: AdHocFilterWithLabels[]) {
  const filtersVar = getFiltersVariable(originFilters);

  const queryRunner = new SceneQueryRunner({
    datasource: DS,
    queries: [{ refId: 'A', scenarioId: 'random_walk' }],
  });

  return new EmbeddedScene({
    $timeRange: new SceneTimeRange({ from: 'now-6h', to: 'now' }),
    $variables: new SceneVariableSet({ variables: [filtersVar] }),
    controls: [new VariableValueSelectors({})],
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          ySizing: 'content',
          body: new FilterInspector({
            filtersVar: filtersVar.getRef(),
            queryRunner: queryRunner.getRef(),
          }),
        }),
        new SceneFlexItem({
          minHeight: 240,
          body: PanelBuilders.timeseries().setTitle('Requests').setData(queryRunner).build(),
        }),
      ],
    }),
  });
}

export function getAdhocFiltersAllOptionDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    tabs: [
      new SceneAppPage({
        ...defaults,
        title: 'Default: one of',
        url: `${defaults.url}/one-of`,
        routePath: 'one-of',
        getScene: () =>
          getScene([
            {
              key: 'region',
              operator: '=|',
              value: 'EMEA',
              values: ['EMEA', 'APAC'],
              valueLabels: ['EMEA', 'APAC'],
              origin: 'dashboard',
            },
            {
              key: 'env',
              operator: '!=|',
              value: 'dev',
              values: ['dev'],
              valueLabels: ['dev'],
              origin: 'dashboard',
            },
          ]),
      }),
      new SceneAppPage({
        ...defaults,
        title: 'Default: All',
        url: `${defaults.url}/all`,
        routePath: 'all',
        getScene: () =>
          // no valueLabels, so the pill has to fall back to "All" from the sentinel
          getScene([{ key: 'region', operator: '=|', value: '$__all', values: ['$__all'], origin: 'dashboard' }]),
      }),
    ],
  });
}

interface FilterInspectorState extends SceneObjectState {
  filtersVar: SceneObjectRef<AdHocFiltersVariable>;
  queryRunner: SceneObjectRef<SceneQueryRunner>;
}

function FilterInspectorRenderer({ model }: SceneComponentProps<FilterInspector>) {
  const styles = useStyles2(getStyles);
  const filtersVar = model.state.filtersVar.resolve();
  const queryRunner = model.state.queryRunner.resolve();

  const { filterExpression } = filtersVar.useState();
  const { data } = queryRunner.useState();

  const requestFilters = data?.request?.filters ?? [];

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <span className={styles.label}>Filter expression</span>
        <code className={styles.value} data-testid="demo-filter-expression">
          {filterExpression || '(nothing restricted)'}
        </code>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Sent to datasource</span>
        <code className={styles.value} data-testid="demo-request-filters">
          {requestFilters.length
            ? requestFilters.map((f) => `${f.key} ${f.operator} ${f.values?.join('|') ?? f.value}`).join('   ·   ')
            : '(nothing restricted)'}
        </code>
      </div>
    </div>
  );
}

class FilterInspector extends SceneObjectBase<FilterInspectorState> {
  static Component = FilterInspectorRenderer;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      padding: theme.spacing(2),
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
    }),
    row: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(2),
    }),
    label: css({
      flex: '0 0 160px',
      color: theme.colors.text.secondary,
      fontSize: theme.typography.h6.fontSize,
    }),
    value: css({
      fontSize: theme.typography.h6.fontSize,
      color: theme.colors.text.primary,
      background: theme.colors.background.primary,
      padding: theme.spacing(0.5, 1),
    }),
  };
}
