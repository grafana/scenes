import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, useStyles2, useTheme2 } from '@grafana/ui';
import { t } from '@grafana/i18n';
import React, { memo, useRef, useState, useEffect } from 'react';
import { useMeasure } from 'react-use';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { AdHocFilterPill } from './AdHocFilterPill';
import { AdHocFiltersAlwaysWipCombobox } from './AdHocFiltersAlwaysWipCombobox';

const MAX_VISIBLE_FILTERS = 5;

interface Props {
  controller: AdHocFiltersController;
}

export const AdHocFiltersComboboxRenderer = memo(function AdHocFiltersComboboxRenderer({ controller }: Props) {
  const { originFilters, filters, readOnly, collapsible } = controller.useState();
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const [collapsed, setCollapsed] = useState(true);
  const [wrapperRef, { height: wrapperHeight }] = useMeasure<HTMLDivElement>();

  const clearAll = () => {
    controller.clearAll();
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

  // Combine all visible filters into one array
  const visibleOriginFilters = originFilters?.filter((f) => f.origin) ?? [];
  const visibleFilters = filters.filter((f) => !f.hidden);
  const allFilters = [...visibleOriginFilters, ...visibleFilters];
  const totalFiltersCount = allFilters.length;

  const shouldCollapse = collapsible && collapsed && totalFiltersCount > 0;
  const filtersToRender = shouldCollapse ? allFilters.slice(0, MAX_VISIBLE_FILTERS) : allFilters;

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

      {filtersToRender.map((filter, index) => (
        <AdHocFilterPill
          key={`${filter.origin ? 'origin-' : ''}${index}-${filter.key}`}
          filter={filter}
          controller={controller}
          readOnly={readOnly || filter.readOnly}
          focusOnWipInputRef={focusOnWipInputRef.current}
        />
      ))}

      {!readOnly && !shouldCollapse ? (
        <AdHocFiltersAlwaysWipCombobox controller={controller} ref={focusOnWipInputRef} />
      ) : null}

      {/* Right-side controls: +X more, collapse button, and clear all */}
      <div className={styles.rightControls}>
        {shouldCollapse && totalFiltersCount > MAX_VISIBLE_FILTERS && (
          <span className={styles.moreIndicator}>
            {t('grafana-scenes.variables.adhoc-filters-combobox-renderer.more-filters', '+{{count}} more', {
              count: totalFiltersCount - MAX_VISIBLE_FILTERS,
            })}
          </span>
        )}

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
  clickableCollapsed: css({
    cursor: 'pointer',
    '&:hover': {
      borderColor: theme.colors.border.medium,
    },
  }),
  rightControls: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginLeft: 'auto',
    flexShrink: 0,
  }),
  moreIndicator: css({
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
    ...theme.typography.bodySmall,
    fontStyle: 'italic',
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
