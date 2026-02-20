import { css, cx } from '@emotion/css';
import {
  GrafanaTheme2,
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
} from '@grafana/data';
import { Button, Icon, useStyles2, useTheme2 } from '@grafana/ui';
import { t } from '@grafana/i18n';
import React, { memo, useMemo, useRef, useState, useEffect } from 'react';
import { isArray } from 'lodash';
import { useMeasure } from 'react-use';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { AdHocFilterPill } from './AdHocFilterPill';
import { AdHocFiltersAlwaysWipCombobox } from './AdHocFiltersAlwaysWipCombobox';
import { GroupByPill } from './GroupByPill';
import type { GroupByVariable } from '../../groupby/GroupByVariable';
import type { AdHocFilterWithLabels } from '../AdHocFiltersVariable';

const MAX_VISIBLE_FILTERS = 5;

type OrderedPill =
  | { type: 'filter'; filter: AdHocFilterWithLabels; index: number }
  | { type: 'groupby'; value: string; label: string; applicability?: DrilldownsApplicability };

interface Props {
  controller: AdHocFiltersController;
}

export const AdHocFiltersComboboxRenderer = memo(function AdHocFiltersComboboxRenderer({ controller }: Props) {
  const { originFilters, filters, readOnly, collapsible, valueRecommendations, pillOrder } = controller.useState();
  const groupByVariable = controller.getGroupByVariable?.();
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const [collapsed, setCollapsed] = useState(true);
  const [wrapperRef, { height: wrapperHeight }] = useMeasure<HTMLDivElement>();

  const clearAll = () => {
    controller.clearAll?.();
  };

  // ref that focuses on the always wip filter input
  // defined in the combobox component via useImperativeHandle
  const focusOnWipInputRef = useRef<() => void>();

  // Single line height is approximately minHeight (4 spacing units) + small buffer
  const singleLineThreshold = theme.spacing.gridSize * 5;
  const isMultiLine = collapsible && wrapperHeight > singleLineThreshold;

  const handleCollapseToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (collapsible) {
      setCollapsed(true);
    }
  };

  const handleExpand = () => {
    if (!collapsible) {
      focusOnWipInputRef.current?.();
      return;
    }
    if (collapsed) {
      setCollapsed(false);
    } else {
      focusOnWipInputRef.current?.();
    }
  };

  // Origin filters are always rendered first
  const visibleOriginFilters = originFilters?.filter((f) => f.origin) ?? [];
  const visibleFilters = filters.filter((f) => !f.hidden);

  // Total count includes origin filters + user filters + groupBy count (for collapse logic)
  const totalFiltersCount = visibleOriginFilters.length + visibleFilters.length;

  const shouldCollapse = collapsible && collapsed && totalFiltersCount > 0;

  // Reset collapsed state when there are no filters (only when collapsible)
  useEffect(() => {
    if (collapsible && totalFiltersCount === 0 && collapsed) {
      setCollapsed(false);
    }
  }, [collapsible, totalFiltersCount, collapsed]);

  // Only show collapse button when expanded and content wraps to multiple lines
  const showCollapseButton = collapsible && isMultiLine && !collapsed;

  return (
    <div
      ref={wrapperRef}
      className={cx(styles.comboboxWrapper, {
        [styles.comboboxFocusOutline]: !readOnly,
        [styles.collapsed]: shouldCollapse,
        [styles.clickableCollapsed]: shouldCollapse,
      })}
      onClick={handleExpand}
    >
      <Icon name="filter" className={styles.filterIcon} size="lg" />

      {valueRecommendations && <valueRecommendations.Component model={valueRecommendations} />}

      {/* Origin filters always render first */}
      {visibleOriginFilters.map((filter, index) => (
        <AdHocFilterPill
          key={`origin-${index}-${filter.key}`}
          filter={filter}
          controller={controller}
          readOnly={readOnly || filter.readOnly}
          focusOnWipInputRef={focusOnWipInputRef.current}
        />
      ))}

      {/* Interleaved user filters and groupBy pills, driven by pillOrder */}
      {groupByVariable ? (
        <InterleavedPills
          groupByVariable={groupByVariable}
          controller={controller}
          visibleFilters={visibleFilters}
          pillOrder={pillOrder}
          readOnly={readOnly}
          shouldCollapse={shouldCollapse ?? false}
          focusOnWipInputRef={focusOnWipInputRef.current}
        />
      ) : (
        // No groupBy linked -- render filters only (original behavior)
        visibleFilters.map((filter, index) => (
          <AdHocFilterPill
            key={`${index}-${filter.key}`}
            filter={filter}
            controller={controller}
            readOnly={readOnly || filter.readOnly}
            focusOnWipInputRef={focusOnWipInputRef.current}
          />
        ))
      )}

      {!readOnly && !shouldCollapse ? (
        <AdHocFiltersAlwaysWipCombobox controller={controller} ref={focusOnWipInputRef} />
      ) : null}

      {/* Right-side controls: +X more, collapse button, and clear all */}
      <div className={styles.rightControls}>
        {showCollapseButton && (
          <Button
            className={styles.collapseButton}
            fill="text"
            onClick={handleCollapseToggle}
            aria-label={t(
              'grafana-scenes.variables.adhoc-filters-combobox-renderer.collapse-filters',
              'Collapse filters'
            )}
            aria-expanded={!collapsed}
          >
            {t('grafana-scenes.variables.adhoc-filters-combobox-renderer.collapse', 'Collapse')}
            <Icon name="angle-up" size="md" />
          </Button>
        )}

        <div className={styles.clearAllButton}>
          <Icon name="times" size="md" onClick={clearAll} />
        </div>

        {shouldCollapse && (
          <>
            {totalFiltersCount > MAX_VISIBLE_FILTERS && (
              <span className={styles.moreIndicator}>(+{totalFiltersCount - MAX_VISIBLE_FILTERS})</span>
            )}
            <Icon name="angle-down" className={styles.dropdownIndicator} />
          </>
        )}
      </div>
    </div>
  );
});

/**
 * Separate component that subscribes to GroupByVariable state to build the
 * interleaved pill list. This avoids calling useState() conditionally.
 */
function InterleavedPills({
  groupByVariable,
  controller,
  visibleFilters,
  pillOrder,
  readOnly,
  shouldCollapse,
  focusOnWipInputRef,
}: {
  groupByVariable: GroupByVariable;
  controller: AdHocFiltersController;
  visibleFilters: AdHocFilterWithLabels[];
  pillOrder?: Array<'filter' | 'groupby'>;
  readOnly?: boolean;
  shouldCollapse: boolean;
  focusOnWipInputRef?: () => void;
}) {
  const { value, text, keysApplicability } = groupByVariable.useState();

  const orderedPills = useMemo(() => {
    const groupByValues = isArray(value) ? value.map(String).filter((v) => v !== '') : value ? [String(value)] : [];
    const groupByTexts = isArray(text) ? text.map(String) : text ? [String(text)] : [];

    const result: OrderedPill[] = [];
    let filterIdx = 0;
    let groupByIdx = 0;

    // Fallback: when no pillOrder exists, show filters first then groupBys
    const sequence =
      pillOrder && pillOrder.length > 0
        ? pillOrder
        : [...visibleFilters.map(() => 'filter' as const), ...groupByValues.map(() => 'groupby' as const)];

    for (const type of sequence) {
      if (type === 'filter' && filterIdx < visibleFilters.length) {
        result.push({ type: 'filter', filter: visibleFilters[filterIdx], index: filterIdx });
        filterIdx++;
      } else if (type === 'groupby' && groupByIdx < groupByValues.length) {
        const val = groupByValues[groupByIdx];
        const lbl = groupByTexts[groupByIdx] ?? val;
        const applicability = keysApplicability?.find((item: DrilldownsApplicability) => item.key === val);
        result.push({ type: 'groupby', value: val, label: lbl, applicability });
        groupByIdx++;
      }
    }

    // Append any remaining items not covered by pillOrder (safety net)
    while (filterIdx < visibleFilters.length) {
      result.push({ type: 'filter', filter: visibleFilters[filterIdx], index: filterIdx });
      filterIdx++;
    }
    while (groupByIdx < groupByValues.length) {
      const val = groupByValues[groupByIdx];
      const lbl = groupByTexts[groupByIdx] ?? val;
      const applicability = keysApplicability?.find((item: DrilldownsApplicability) => item.key === val);
      result.push({ type: 'groupby', value: val, label: lbl, applicability });
      groupByIdx++;
    }

    return result;
  }, [visibleFilters, value, text, keysApplicability, pillOrder]);

  const pillsToRender = shouldCollapse ? orderedPills.slice(0, MAX_VISIBLE_FILTERS) : orderedPills;

  const handleRemoveGroupBy = (key: string) => {
    controller.removeGroupByValue?.(key);
  };

  return (
    <>
      {pillsToRender.map((pill, i) =>
        pill.type === 'filter' ? (
          <AdHocFilterPill
            key={`filter-${pill.index}-${pill.filter.key}`}
            filter={pill.filter}
            controller={controller}
            readOnly={readOnly || pill.filter.readOnly}
            focusOnWipInputRef={focusOnWipInputRef}
          />
        ) : (
          <GroupByPill
            key={`groupby-${pill.value}`}
            value={pill.value}
            label={pill.label}
            readOnly={readOnly}
            applicability={pill.applicability}
            onRemove={handleRemoveGroupBy}
          />
        )
      )}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  comboboxWrapper: css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing(1),
    rowGap: theme.spacing(0.5),
    minHeight: theme.spacing(4),
    backgroundColor: theme.components.input.background,
    border: `1px solid ${theme.colors.border.strong}`,
    borderRadius: theme.shape.radius.default,
    paddingInline: theme.spacing(1),
    paddingBlock: theme.spacing(0.5),
    flexGrow: 1,
    width: '100%',
  }),
  comboboxFocusOutline: css({
    '&:focus-within': {
      outline: '2px dotted transparent',
      outlineOffset: '2px',
      boxShadow: `0 0 0 2px ${theme.colors.background.canvas}, 0 0 0px 4px ${theme.colors.primary.main}`,
      transitionTimingFunction: `cubic-bezier(0.19, 1, 0.22, 1)`,
      transitionDuration: '0.2s',
      transitionProperty: 'outline, outline-offset, box-shadow',
      zIndex: 2,
    },
  }),
  filterIcon: css({
    color: theme.colors.text.secondary,
    alignSelf: 'center',
  }),
  collapsed: css({
    flexWrap: 'nowrap',
    overflow: 'hidden',
  }),
  clickableCollapsed: css({
    cursor: 'pointer',
    '&:hover': {
      borderColor: theme.colors.border.medium,
    },
  }),
  rightControls: css({
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    flexShrink: 0,
  }),
  moreIndicator: css({
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
  }),
  dropdownIndicator: css({
    color: theme.colors.text.secondary,
    flexShrink: 0,
  }),
  collapseButton: css({
    color: theme.colors.text.secondary,
    padding: 0,
    fontSize: theme.typography.bodySmall.fontSize,
    border: 'none',
    '&:hover': {
      background: 'transparent',
      color: theme.colors.text.primary,
    },
  }),
  clearAllButton: css({
    fontSize: theme.typography.bodySmall.fontSize,
    cursor: 'pointer',
    color: theme.colors.text.secondary,
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
});
