import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import React, { Fragment, memo, useEffect, useRef, useState } from 'react';
import { AdHocFiltersVariable } from '../AdHocFiltersVariable';
import { AdHocFilterPill } from './AdHocFilterPill';
import { AdHocFiltersAlwaysWipCombobox } from './AdHocFiltersAlwaysWipCombobox';
import { debounce } from 'lodash';

interface Props {
  model: AdHocFiltersVariable;
}

export const AdHocFiltersComboboxRenderer = memo(function AdHocFiltersComboboxRenderer({ model }: Props) {
  const { filters, readOnly } = model.useState();
  const styles = useStyles2(getStyles);
  const [limitFiltersTo, setLimitFiltersTo] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleCollapseFilters = (shouldCollapse: boolean) => {
    if (!shouldCollapse) {
      setLimitFiltersTo(null);
      return;
    }
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      if (rect.height - 6 > 26) {
        const componentLineSpan = (rect.height - 6) / 26;
        const filterCutOff = Math.max(1, Math.floor(filters.length / (componentLineSpan + 1)));
        setLimitFiltersTo(filterCutOff);
      } else {
        setLimitFiltersTo(null);
      }
    }
  };

  const debouncedSetActive = debounce(handleCollapseFilters, 100);

  useEffect(() => {
    handleCollapseFilters(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ref that focuses on the always wip filter input
  // defined in the combobox component via useImperativeHandle
  const focusOnWipInputRef = useRef<() => void>();

  return (
    <div
      className={cx(styles.comboboxWrapper, { [styles.comboboxFocusOutline]: !readOnly })}
      onClick={() => {
        focusOnWipInputRef.current?.();
      }}
      ref={wrapperRef}
      onFocusCapture={(e) => {
        debouncedSetActive(false);
      }}
      onBlurCapture={(e) => {
        debouncedSetActive(true);
      }}
    >
      <Icon name="filter" className={styles.filterIcon} size="lg" />

      {(limitFiltersTo ? filters.slice(0, limitFiltersTo) : filters).map((filter, index) => (
        <AdHocFilterPill
          key={`${index}-${filter.key}`}
          filter={filter}
          model={model}
          readOnly={readOnly}
          focusOnWipInputRef={focusOnWipInputRef.current}
        />
      ))}

      {limitFiltersTo ? (
        <Tooltip
          content={
            <div>
              {filters.slice(limitFiltersTo).map((filter, i) => {
                const keyLabel = filter.keyLabel ?? filter.key;
                // TODO remove when we're on the latest version of @grafana/data
                //@ts-expect-error
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
          <div className={cx(styles.basePill)}>+{filters.length - limitFiltersTo} filters </div>
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
