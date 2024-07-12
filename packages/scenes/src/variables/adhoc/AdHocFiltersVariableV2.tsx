import { css } from '@emotion/css';
import { useStyles2, Icon } from '@grafana/ui';
import React from 'react';
import { SceneComponentProps } from '../../core/types';
import { AdHocCombobox, AdHocFilterEditSwitch } from './AdHocCombobox';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { GrafanaTheme2 } from '@grafana/data';

export class AdHocFiltersVariableV2 extends AdHocFiltersVariable {
  static Component = AdHocFiltersVariableRendererV2;
}

export function AdHocFiltersVariableRendererV2({ model }: SceneComponentProps<AdHocFiltersVariable>) {
  const { filters } = model.useState();
  const styles = useStyles2(getStyles2);

  return (
    <div className={styles.wrapper}>
      <Icon name="filter" className={styles.filterIcon} size="lg" />

      {filters.map((filter, index) => (
        <AdHocFilterEditSwitch key={index} filter={filter} model={model} />
      ))}

      <AdHocCombobox model={model} wip />
    </div>
  );
}

const getStyles2 = (theme: GrafanaTheme2) => ({
  wrapper: css({
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
