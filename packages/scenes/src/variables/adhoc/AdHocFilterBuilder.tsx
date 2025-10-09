import { t } from '@grafana/i18n';
import React from 'react';

import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { Button, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

interface Props {
  model: AdHocFiltersVariable;
  addFilterButtonText?: string;
}

export function AdHocFilterBuilder({ model, addFilterButtonText }: Props) {
  const { _wip } = model.useState();
  const styles = useStyles2(getStyles);

  if (!_wip) {
    return (
      <Button
        variant="secondary"
        icon="plus"
        title={t('grafana-scenes.variables.ad-hoc-filter-builder.title-add-filter', 'Add filter')}
        aria-label={t('grafana-scenes.variables.ad-hoc-filter-builder.aria-label-add-filter', 'Add filter')}
        data-testid={`AdHocFilter-add`}
        onClick={() => model._addWip()}
        className={styles.addButton}
      >
        {addFilterButtonText}
      </Button>
    );
  }

  return <AdHocFilterRenderer filter={_wip} model={model} />;
}

const getStyles = (theme: GrafanaTheme2) => ({
  addButton: css({
    '&:first-child': {
      borderBottomLeftRadius: 0,
      borderTopLeftRadius: 0,
    },
  })
})
