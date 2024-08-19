import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import React, { memo, useRef } from 'react';
import { AdHocFiltersVariable } from '../AdHocFiltersVariable';
import { AdHocFiltersComboboxEditSwitch } from './AdHocFiltersComboboxEditSwitch';
import { AdHocFiltersAlwaysWipCombobox } from './AdHocFiltersAlwaysWipCombobox';

export const AdHocFiltersComboboxRenderer = memo(function AdHocFiltersComboboxRenderer({
  model,
}: {
  model: AdHocFiltersVariable;
}) {
  const { filters } = model.useState();
  const styles = useStyles2(getStyles);
  const focusOnInputRef = useRef<() => void>();

  return (
    <div
      className={styles.comboboxWrapper}
      onClick={() => {
        focusOnInputRef.current?.();
      }}
    >
      <Icon name="filter" className={styles.filterIcon} size="lg" />

      {filters.map((filter, index) => (
        <AdHocFiltersComboboxEditSwitch key={index} filter={filter} model={model} />
      ))}

      <AdHocFiltersAlwaysWipCombobox model={model} ref={focusOnInputRef} />
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

    '&:focus-within': {
      outline: '2px dotted transparent',
      outlineOffset: '2px',
      boxShadow: `0 0 0 2px ${theme.colors.background.canvas}, 0 0 0px 4px ${theme.colors.primary.main}`,
      transitionTimingFunction: `cubic-bezier(0.19, 1, 0.22, 1)`,
      transitionDuration: '0.2s',
      transitionProperty: 'outline, outline-offset, box-shadow',
    },
  }),
  filterIcon: css({
    color: theme.colors.text.secondary,
    alignSelf: 'center',
  }),
});
