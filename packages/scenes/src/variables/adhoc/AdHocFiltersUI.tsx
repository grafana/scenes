import React from 'react';

import { AdHocFilterBuilder } from './AdHocFilterBuilder';
import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { SceneComponentProps } from '../../core/types';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { AdHocFilterSeparator } from './AdHocFilterSeparator';
import { ControlsLabel } from '../../utils/ControlsLabel';

export function AdHocFiltersUI({ model }: SceneComponentProps<AdHocFiltersVariable>) {
  const { filters, readOnly } = model.useState();
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.wrapper}>
      <ControlsLabel label="Filters" icon="filter" />

      {filters.map((filter, index) => (
        <React.Fragment key={index}>
          {index > 0 && <AdHocFilterSeparator />}
          <AdHocFilterRenderer filter={filter} model={model} />
        </React.Fragment>
      ))}

      {!readOnly && <AdHocFilterBuilder model={model} key="'builder" />}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  }),
  filterIcon: css({
    color: theme.colors.text.secondary,
    paddingRight: theme.spacing(0.5),
  }),
});
