import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, useStyles2 } from '@grafana/ui';
import { t } from '@grafana/i18n';
import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import { useWindowSize } from 'react-use';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';
import { AdHocFilterPill } from './AdHocFilterPill';
import { AdHocFiltersAlwaysWipCombobox } from './AdHocFiltersAlwaysWipCombobox';

interface Props {
  controller: AdHocFiltersController;
}

export const AdHocFiltersComboboxRenderer = memo(function AdHocFiltersComboboxRenderer({ controller }: Props) {
  const { originFilters, filters, readOnly, collapsible } = controller.useState();
  const styles = useStyles2(getStyles);
  const [collapsed, setCollapsed] = useState(true);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ref that focuses on the always wip filter input
  // defined in the combobox component via useImperativeHandle
  const focusOnWipInputRef = useRef<() => void>();

  const { width: windowWidth } = useWindowSize();

  // Check if content has wrapped to multiple lines
  const checkMultiLine = useCallback(() => {
    if (wrapperRef.current && collapsible) {
      // Single line height is approximately minHeight (32px = 4 spacing units)
      const singleLineThreshold = 40; // slightly more than minHeight to account for padding
      setIsMultiLine(wrapperRef.current.scrollHeight > singleLineThreshold);
    }
  }, [collapsible]);

  useEffect(() => {
    checkMultiLine();
  }, [checkMultiLine, filters, originFilters, windowWidth, collapsed]);

  const handleCollapseToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setCollapsed(true);
  };

  const handleExpand = () => {
    if (collapsed) {
      setCollapsed(false);
    } else {
      focusOnWipInputRef.current?.();
    }
  };

  // Combine all visible filters into one array for easier slicing
  const visibleOriginFilters = originFilters?.filter((f) => f.origin) ?? [];
  const visibleFilters = filters.filter((f) => !f.hidden);
  const allFilters = [...visibleOriginFilters, ...visibleFilters];
  const totalFiltersCount = allFilters.length;

  // When collapsed, only show first 2 pills
  const maxVisibleWhenCollapsed = 2;
  const filtersToRender = collapsed ? allFilters.slice(0, maxVisibleWhenCollapsed) : allFilters;
  const hiddenCount = collapsed ? Math.max(0, totalFiltersCount - maxVisibleWhenCollapsed) : 0;

  // Reset collapsed state when there are no filters
  useEffect(() => {
    if (totalFiltersCount === 0 && collapsed) {
      setCollapsed(false);
    }
  }, [totalFiltersCount, collapsed]);

  // Only show collapse button when expanded and content wraps to multiple lines
  const showCollapseButton = collapsible && isMultiLine && !collapsed;

  return (
    <div
      ref={wrapperRef}
      className={cx(styles.comboboxWrapper, {
        [styles.comboboxFocusOutline]: !readOnly,
        [styles.collapsed]: collapsed && hiddenCount > 0,
        [styles.clickableCollapsed]: collapsed && hiddenCount > 0,
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

      {hiddenCount > 0 && (
        <span className={styles.moreIndicator}>
          {t('grafana-scenes.variables.adhoc-filters-combobox-renderer.more-filters', '+{{count}} more', {
            count: hiddenCount,
          })}
        </span>
      )}

      {!readOnly ? (
        <AdHocFiltersAlwaysWipCombobox
          controller={controller}
          ref={focusOnWipInputRef}
          onInputClick={hiddenCount > 0 ? () => setCollapsed(false) : undefined}
        />
      ) : null}

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
  moreIndicator: css({
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
    ...theme.typography.bodySmall,
    fontStyle: 'italic',
    marginLeft: theme.spacing(0.5),
  }),
  collapseButton: css({
    marginLeft: 'auto',
    color: theme.colors.text.secondary,
    padding: 0,
    fontSize: theme.typography.bodySmall.fontSize,
    border: 'none',
    '&:hover': {
      background: 'transparent',
      color: theme.colors.text.primary,
    },
  }),
});
