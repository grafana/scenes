import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, IconButton, Icon, useStyles2, useTheme2 } from '@grafana/ui';
import { t } from '@grafana/i18n';
import React, { memo, useRef, useState, useEffect } from 'react';
import { useMeasure } from 'react-use';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { AdHocFilterPill } from './AdHocFilterPill';
import { AdHocFiltersAlwaysWipCombobox } from './AdHocFiltersAlwaysWipCombobox';
import { GroupByPill } from './GroupByPill';

const MAX_VISIBLE_FILTERS_DEFAULT = 4;
const MAX_VISIBLE_FILTERS_WITH_GROUP_BY = 2;
const MAX_VISIBLE_GROUP_BY = 2;

interface Props {
  controller: AdHocFiltersController;
}

export const AdHocFiltersComboboxRenderer = memo(function AdHocFiltersComboboxRenderer({ controller }: Props) {
  const { originFilters, filters, readOnly, collapsible, valueRecommendations, enableGroupBy } =
    controller.useState();
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
  const focusOnGroupByWipInputRef = useRef<() => void>();

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
    if (collapsible && collapsed) {
      setCollapsed(false);
    }
  };

  // Combine all visible filters into one array
  const visibleOriginFilters = originFilters?.filter((f) => f.origin) ?? [];
  const visibleFilters = filters.filter((f) => !f.hidden);
  const allFilters = [...visibleOriginFilters, ...visibleFilters];
  const totalFiltersCount = allFilters.length;

  const adhocFilters = allFilters.filter((f) => f.operator !== 'groupBy');
  const groupByFilters = allFilters.filter((f) => f.operator === 'groupBy');
  
  const shouldCollapse = collapsible && collapsed && totalFiltersCount > 0;

  const maxVisibleAdhocFilters = enableGroupBy ? MAX_VISIBLE_FILTERS_WITH_GROUP_BY : MAX_VISIBLE_FILTERS_DEFAULT;
  const adhocFiltersToRender = shouldCollapse ? adhocFilters.slice(0, maxVisibleAdhocFilters) : adhocFilters;
  const adhocHiddenCount = shouldCollapse ? Math.max(0, adhocFilters.length - maxVisibleAdhocFilters) : 0;

  const groupByFiltersToRender = shouldCollapse ? groupByFilters.slice(0, MAX_VISIBLE_GROUP_BY) : groupByFilters;
  const groupByHiddenCount = shouldCollapse ? Math.max(0, groupByFilters.length - MAX_VISIBLE_GROUP_BY) : 0;

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
      })}
    >
      {valueRecommendations && <valueRecommendations.Component model={valueRecommendations} />}

      {adhocFiltersToRender.map((filter, index) => (
        <AdHocFilterPill
          key={`${filter.origin ? 'origin-' : ''}${index}-${filter.key}`}
          filter={filter}
          controller={controller}
          readOnly={readOnly || filter.readOnly}
          focusOnWipInputRef={focusOnWipInputRef.current}
        />
      ))}

      {shouldCollapse && adhocHiddenCount > 0 && (
        <button
          className={styles.moreIndicator}
          aria-label={t('grafana-scenes.variables.adhoc-filters-combobox-renderer.show-more-filters', 'Show {{count}} more filters', { count: adhocHiddenCount })}
          onClick={(e) => {
            e.stopPropagation();
            handleExpand();
            setTimeout(() => focusOnWipInputRef.current?.());
          }}
        >
          +{adhocHiddenCount}
        </button>
      )}

      {!readOnly ? (
        <AdHocFiltersAlwaysWipCombobox ref={focusOnWipInputRef} controller={controller} onInputClick={handleExpand} />
      ) : null}

      {enableGroupBy && (
        <>
          <div className={styles.sectionDivider} />
          <span className={styles.groupByLabel}>
            {t('grafana-scenes.variables.adhoc-filters-combobox-renderer.group-by-label', 'Group by:')}
          </span>

          {groupByFiltersToRender.map((filter, index) => (
            <GroupByPill
              key={`groupby-${index}-${filter.key}`}
              filter={filter}
              controller={controller}
              readOnly={readOnly}
              focusOnWipInputRef={focusOnGroupByWipInputRef.current}
            />
          ))}

          {shouldCollapse && groupByHiddenCount > 0 && (
            <button
              className={styles.moreIndicator}
              aria-label={t('grafana-scenes.variables.adhoc-filters-combobox-renderer.show-more-group-by', 'Show {{count}} more group by', { count: groupByHiddenCount })}
              onClick={(e) => {
                e.stopPropagation();
                handleExpand();
                setTimeout(() => focusOnGroupByWipInputRef.current?.());
              }}
            >
              +{groupByHiddenCount}
            </button>
          )}

          {!readOnly ? (
            <AdHocFiltersAlwaysWipCombobox 
              ref={focusOnGroupByWipInputRef} 
              controller={controller} 
              onInputClick={handleExpand} 
              isGroupBy 
            />
          ) : null}
        </>
      )}

      {/* Right-side controls: collapse button and clear all */}
      <div className={styles.rightControls}>
        <div className={styles.sectionDivider} />

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
      
        {shouldCollapse && (adhocHiddenCount > 0 || groupByHiddenCount > 0) && (
          <IconButton
            name="angle-down"
            size="md"
            className={styles.dropdownIndicator}
            tooltip={t(
              'grafana-scenes.variables.adhoc-filters-combobox-renderer.expand-filters',
              'Expand filters'
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleExpand();
            }}
          />
        )}

        <IconButton
          name="times"
          size="md"
          className={styles.clearAllButton}
          tooltip={t(
            'grafana-scenes.variables.adhoc-filters-combobox-renderer.clear-all',
            'Clear all'
          )}
          onClick={clearAll}
        />
      </div>
    </div>
  );
});

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
  rightControls: css({
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    flexShrink: 0,
    gap: theme.spacing(1.5),
  }),
  moreIndicator: css({
    color: theme.colors.text.primary,
    whiteSpace: 'nowrap',
    ...theme.typography.bodySmall,
    fontWeight: theme.typography.fontWeightBold,
    background: theme.colors.action.selected,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(0.25, 0.75),
    border: 'none',
    cursor: 'pointer',
    '&:hover': {
      background: theme.colors.action.hover,
    },
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
  sectionDivider: css({
    width: '1px',
    alignSelf: 'stretch',
    backgroundColor: theme.colors.border.weak,
    flexShrink: 0,
  }),
  groupByLabel: css({
    ...theme.typography.bodySmall,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text.primary,
    whiteSpace: 'nowrap',
  }),
  clearAllButton: css({
    color: theme.colors.text.secondary,
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
});
