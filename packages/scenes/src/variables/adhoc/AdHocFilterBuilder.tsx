import { t } from '@grafana/i18n';

import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { Button } from '@grafana/ui';

interface Props {
  model: AdHocFiltersVariable;
  addFilterButtonText?: string;
}

export function AdHocFilterBuilder({ model, addFilterButtonText }: Props) {
  const { _wip } = model.useState();

  if (!_wip) {
    return (
      <Button
        variant="secondary"
        icon="plus"
        title={t('grafana-scenes.variables.ad-hoc-filter-builder.title-add-filter', 'Add filter')}
        aria-label={t('grafana-scenes.variables.ad-hoc-filter-builder.aria-label-add-filter', 'Add filter')}
        data-testid={`AdHocFilter-add`}
        onClick={() => model._addWip()}
      >
        {addFilterButtonText}
      </Button>
    );
  }

  return <AdHocFilterRenderer filter={_wip} model={model} />;
}
