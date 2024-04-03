import React, { useMemo, useState } from 'react';

import { AdHocFiltersVariable, toSelectableValue } from './AdHocFiltersVariable';
import { AdHocVariableFilter, GrafanaTheme2, SelectableValue, toOption } from '@grafana/data';
import { Button, Field, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { ControlsLabel } from '../../utils/ControlsLabel';

interface Props {
  filter: AdHocVariableFilter;
  model: AdHocFiltersVariable;
}

export function AdHocFilterRenderer({ filter, model }: Props) {
  const styles = useStyles2(getStyles);

  // there's a bug in react-select where the menu doesn't recalculate its position when the options are loaded asynchronously
  // see https://github.com/grafana/grafana/issues/63558
  // instead, we explicitly control the menu visibility and prevent showing it until the options have fully loaded

  const [state, setState] = useState<{
    keys?: SelectableValue[];
    values?: SelectableValue[];
    isKeysLoading?: boolean;
    isValuesLoading?: boolean;
    isKeysOpen?: boolean;
    isValuesOpen?: boolean;
  }>({});

  const keyValue = useMemo(() => {
    if (filter.key !== '') {
      if (model.state.defaultKeys) {
        const matchingDefaultKey = model.state.defaultKeys.find(option => option.value === filter.key);
        if (matchingDefaultKey) {
          return toSelectableValue(matchingDefaultKey);
        }
      } else {
        return toOption(filter.key);
      }
    }
    return null;
  }, [filter.key, model.state.defaultKeys])
  const valueValue = filter.value !== '' ? toOption(filter.value) : null;

  const valueSelect = (
    <Select
      allowCustomValue
      disabled={model.state.readOnly}
      className={state.isKeysOpen ? styles.widthWhenOpen : undefined}
      width="auto"
      value={valueValue}
      placeholder={'Select value'}
      options={state.values}
      onChange={(v) => model._updateFilter(filter, 'value', v.value)}
      isOpen={state.isValuesOpen}
      isLoading={state.isValuesLoading}
      autoFocus={filter.key !== '' && filter.value === ''}
      openMenuOnFocus={true}
      onOpenMenu={async () => {
        setState({ ...state, isValuesLoading: true });
        const values = await model._getValuesFor(filter);
        setState({ ...state, isValuesLoading: false, isValuesOpen: true, values });
      }}
      onCloseMenu={() => {
        setState({ ...state, isValuesOpen: false });
      }}
    />
  );

  const keySelect = (
    <Select
      // By changing the key, we reset the Select component,
      // to ensure that the loaded values are shown after they are loaded
      key={`${state.isValuesLoading ? 'loading' : 'loaded'}`}
      disabled={model.state.readOnly}
      className={state.isKeysOpen ? styles.widthWhenOpen : undefined}
      width="auto"
      value={keyValue}
      placeholder={'Select label'}
      options={state.keys}
      onChange={(v) => model._updateFilter(filter, 'key', v.value)}
      autoFocus={filter.key === ''}
      isOpen={state.isKeysOpen}
      isLoading={state.isKeysLoading}
      onOpenMenu={async () => {
        setState({ ...state, isKeysLoading: true });
        const keys = await model._getKeys(filter.key);
        setState({ ...state, isKeysLoading: false, isKeysOpen: true, keys });
      }}
      onCloseMenu={() => {
        setState({ ...state, isKeysOpen: false });
      }}
      onBlur={() => {
        if (filter.key === '') {
          model._removeFilter(filter);
        }
      }}
      openMenuOnFocus={true}
    />
  );

  if (model.state.layout === 'vertical') {
    if (filter.key) {
      const label = (
        <ControlsLabel layout="vertical" label={filter.key ?? ''} onRemove={() => model._removeFilter(filter)} />
      );

      return (
        <Field label={label} data-testid={`AdHocFilter-${filter.key}`} className={styles.field}>
          {valueSelect}
        </Field>
      );
    } else {
      return (
        <Field label={'Select label'} data-testid={`AdHocFilter-${filter.key}`} className={styles.field}>
          {keySelect}
        </Field>
      );
    }
  }

  return (
    <div className={styles.wrapper} data-testid={`AdHocFilter-${filter.key}`}>
      {keySelect}
      <Select
        value={filter.operator}
        disabled={model.state.readOnly}
        options={model._getOperators()}
        width="auto"
        onChange={(v) => model._updateFilter(filter, 'operator', v.value)}
      />
      {valueSelect}
      <Button
        variant="secondary"
        aria-label="Remove filter"
        title="Remove filter"
        className={styles.removeButton}
        icon="times"
        data-testid={`AdHocFilter-remove-${filter.key ?? ''}`}
        onClick={() => model._removeFilter(filter)}
      />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  field: css({
    marginBottom: 0,
  }),
  wrapper: css({
    display: 'flex',
    '> *': {
      '&:not(:first-child)': {
        // Negative margin hides the double-border on adjacent selects
        marginLeft: -1,
      },

      '&:first-child': {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      },

      '&:last-child': {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      },

      '&:not(:first-child):not(:last-child)': {
        borderRadius: 0,
      },

      // Fix focus state zIndex issues
      position: 'relative',
      zIndex: 0,

      // Adjacent borders are overlapping, so raise children up when hovering etc
      // so all that child's borders are visible.
      '&:hover': {
        zIndex: 1,
      },

      '&:focus-within': {
        zIndex: 2,
      },
    },
  }),
  widthWhenOpen: css({
    minWidth: theme.spacing(16),
  }),
  removeButton: css({
    paddingLeft: theme.spacing(3 / 2),
    paddingRight: theme.spacing(3 / 2),
    borderLeft: 'none',
    // To not have button background and last select border intersect
    position: 'relative',
    left: '1px',
  }),
});
