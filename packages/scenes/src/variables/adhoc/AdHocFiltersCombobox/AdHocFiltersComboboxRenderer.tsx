import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import React, { Fragment, memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AdHocFiltersVariable } from '../AdHocFiltersVariable';
import { AdHocFilterPill } from './AdHocFilterPill';
import { AdHocFiltersAlwaysWipCombobox } from './AdHocFiltersAlwaysWipCombobox';
import { debounce } from 'lodash';
import { calculateCollapseThreshold } from './utils';

interface Props {
  model: AdHocFiltersVariable;
}

export const AdHocFiltersComboboxRenderer = memo(function AdHocFiltersComboboxRenderer({ model }: Props) {
  const { filters, readOnly } = model.useState();
  const styles = useStyles2(getStyles);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ref that focuses on the always wip filter input
  // defined in the combobox component via useImperativeHandle
  const focusOnWipInputRef = useRef<() => void>();

  const [collapseThreshold, setCollapseThreshold] = useState<number | null>(null);

  const updateCollapseThreshold = useCallback(
    (shouldCollapse: boolean, filtersLength: number) => {
      const filterCollapseThreshold = calculateCollapseThreshold(
        !readOnly ? shouldCollapse : false,
        filtersLength,
        wrapperRef
      );
      setCollapseThreshold(filterCollapseThreshold);
    },
    [readOnly]
  );

  const debouncedSetActive = useMemo(() => debounce(updateCollapseThreshold, 100), [updateCollapseThreshold]);

  const handleFilterCollapse = useCallback(
    (shouldCollapse: boolean, filtersLength: number) => () => {
      debouncedSetActive(shouldCollapse, filtersLength);
    },
    [debouncedSetActive]
  );

  useLayoutEffect(() => {
    // updateCollapseThreshold(!!model.state.collapseFilters ? true : false, filters.length);
    updateCollapseThreshold(true, filters.length);
    // needs to run only on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={cx(styles.comboboxWrapper, { [styles.comboboxFocusOutline]: !readOnly })}
      onClick={() => {
        focusOnWipInputRef.current?.();
      }}
      ref={wrapperRef}
      onFocusCapture={handleFilterCollapse(false, filters.length)}
      // onBlurCapture={handleFilterCollapse(!!model.state.collapseFilters ? true : false, filters.length}
      onBlurCapture={handleFilterCollapse(true, filters.length)}
    >
      <Icon name="filter" className={styles.filterIcon} size="lg" />

      {(collapseThreshold ? filters.slice(0, collapseThreshold) : filters).map((filter, index) => (
        <AdHocFilterPill
          key={`${index}-${filter.key}`}
          filter={filter}
          model={model}
          readOnly={readOnly}
          focusOnWipInputRef={focusOnWipInputRef.current}
        />
      ))}

      {collapseThreshold ? (
        <Tooltip
          content={
            <div>
              {filters.slice(collapseThreshold).map((filter, i) => {
                const keyLabel = filter.keyLabel ?? filter.key;
                const valueLabel = filter.valueLabels?.join(', ') || filter.values?.join(', ') || filter.value;
                return (
                  <Fragment key={`${keyLabel}-${i}`}>
                    {keyLabel} {filter.operator} {valueLabel} <br />
                  </Fragment>
                );
              })}
            </div>
          }
        >
          <div className={cx(styles.basePill)}>+{filters.length - collapseThreshold} filters </div>
        </Tooltip>
      ) : null}

      {!readOnly ? <AdHocFiltersAlwaysWipCombobox model={model} ref={focusOnWipInputRef} /> : null}
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
  basePill: css({
    display: 'flex',
    alignItems: 'center',
    background: theme.colors.action.selected,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.125, 1, 0.125, 1),
    color: theme.colors.text.primary,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    minHeight: theme.spacing(2.75),
    ...theme.typography.bodySmall,
    cursor: 'pointer',
  }),
});
