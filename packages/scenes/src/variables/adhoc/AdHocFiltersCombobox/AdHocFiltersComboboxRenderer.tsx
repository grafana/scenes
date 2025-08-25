import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import React, { memo, useRef } from 'react';
import { AdHocFiltersVariable } from '../AdHocFiltersVariable';
import { AdHocFilterPill } from './AdHocFilterPill';
import { AdHocFiltersAlwaysWipCombobox } from './AdHocFiltersAlwaysWipCombobox';

interface Props {
  model: AdHocFiltersVariable;
}

export const AdHocFiltersComboboxRenderer = memo(function AdHocFiltersComboboxRenderer({ model }: Props) {
  const { originFilters, filters, readOnly } = model.useState();
  const styles = useStyles2(getStyles);

  // ref that focuses on the always wip filter input
  // defined in the combobox component via useImperativeHandle
  const focusOnWipInputRef = useRef<() => void>();

  return (
    <div
      className={cx(styles.comboboxWrapper, { [styles.comboboxFocusOutline]: !readOnly })}
      onClick={() => {
        focusOnWipInputRef.current?.();
      }}
    >
      <Icon name="filter" className={styles.filterIcon} size="lg" />

      {originFilters?.map((filter, index) =>
        filter.origin ? (
          <AdHocFilterPill
            key={`${index}-${filter.key}`}
            filter={filter}
            model={model}
            focusOnWipInputRef={focusOnWipInputRef.current}
          />
        ) : null
      )}

      {filters
        .filter((filter) => !filter.hidden)
        .map((filter, index) => (
          <AdHocFilterPill
            key={`${index}-${filter.key}`}
            filter={filter}
            model={model}
            readOnly={readOnly || filter.readOnly}
            focusOnWipInputRef={focusOnWipInputRef.current}
          />
        ))}

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
});
