import { t } from '@grafana/i18n';
import React, { useMemo, useState } from 'react';

import { AdHocFiltersVariable, AdHocFilterWithLabels, isMultiValueOperator, OPERATORS } from './AdHocFiltersVariable';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, Field, InputActionMeta, Select, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { ControlsLabel } from '../../utils/ControlsLabel';
import { getAdhocOptionSearcher } from './getAdhocOptionSearcher';
import { handleOptionGroups } from '../utils';
import { OptionWithCheckbox } from '../components/VariableValueSelect';

interface Props {
  filter: AdHocFilterWithLabels;
  model: AdHocFiltersVariable;
}

function keyLabelToOption(key: string, label?: string): SelectableValue | null {
  return key !== ''
    ? {
        value: key,
        label: label || key,
      }
    : null;
}

const filterNoOp = () => true;

export function AdHocFilterRenderer({ filter, model }: Props) {
  const styles = useStyles2(getStyles);

  const [keys, setKeys] = useState<SelectableValue[]>([]);
  const [values, setValues] = useState<SelectableValue[]>([]);
  const [isKeysLoading, setIsKeysLoading] = useState(false);
  const [isValuesLoading, setIsValuesLoading] = useState(false);
  const [isKeysOpen, setIsKeysOpen] = useState(false);
  const [isValuesOpen, setIsValuesOpen] = useState(false);
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);
  const [valueInputValue, setValueInputValue] = useState('');
  const [valueHasCustomValue, setValueHasCustomValue] = useState(false);
  // To not trigger queries on every selection we store this state locally here and only update the variable onBlur
  const [uncommittedValue, setUncommittedValue] = useState<SelectableValue>(
    filter.values ? filter.values.map((value, index) => keyLabelToOption(value, filter.valueLabels?.[index])) : []
  );
  const isMultiValue = isMultiValueOperator(filter.operator);

  const keyValue = keyLabelToOption(filter.key, filter.keyLabel);
  const valueValue = keyLabelToOption(filter.value, filter.valueLabels?.[0]);

  const optionSearcher = useMemo(() => getAdhocOptionSearcher(values), [values]);
  const onAddCustomValue = model.state.onAddCustomValue;

  const onValueInputChange = (value: string, { action }: InputActionMeta) => {
    if (action === 'input-change') {
      setValueInputValue(value);
    }
    return value;
  };

  const onOperatorChange = (v: SelectableValue) => {
    const existingOperator = filter.operator;
    const newOperator = v.value;

    const update: Partial<AdHocFilterWithLabels> = { operator: newOperator };
    // clear value if operator has changed from multi to single
    if (isMultiValueOperator(existingOperator) && !isMultiValueOperator(newOperator)) {
      update.value = '';
      update.valueLabels = [''];
      update.values = undefined;
      setUncommittedValue([]);
      // set values if operator has changed from single to multi
    } else if (!isMultiValueOperator(existingOperator) && isMultiValueOperator(newOperator) && filter.value) {
      update.values = [filter.value];
      setUncommittedValue([
        {
          value: filter.value,
          label: filter.valueLabels?.[0] ?? filter.value,
        },
      ]);
    }
    model._updateFilter(filter, update);
  };

  const filteredValueOptions = useMemo(
    () => handleOptionGroups(optionSearcher(valueInputValue)),
    [optionSearcher, valueInputValue]
  );

  const multiValueProps = {
    isMulti: true,
    value: uncommittedValue,
    components: {
      Option: OptionWithCheckbox,
    },
    hideSelectedOptions: false,
    closeMenuOnSelect: false,
    openMenuOnFocus: false,
    onChange: (v: SelectableValue) => {
      setUncommittedValue(v);
      // clear input value when creating a new custom multi value
      if (v.some((value: SelectableValue) => value.__isNew__)) {
        setValueInputValue('');
      }
    },
    onBlur: () => {
      model._updateFilter(filter, {
        value: uncommittedValue[0]?.value ?? '',
        // TODO remove expect-error when we're on the latest version of @grafana/data
        values: uncommittedValue.map((option: SelectableValue<string>) => option.value),
        valueLabels: uncommittedValue.map((option: SelectableValue<string>) => option.label),
      });
    },
  };

  const operatorDefinition = OPERATORS.find((op) => filter.operator === op.value);

  const valueSelect = (
    <Select
      virtualized
      allowCustomValue={model.state.allowCustomValue ?? true}
      createOptionPosition={operatorDefinition?.isRegex ? 'first' : 'last'}
      isValidNewOption={(inputValue) => inputValue.trim().length > 0}
      allowCreateWhileLoading
      formatCreateLabel={(inputValue) => `Use custom value: ${inputValue}`}
      disabled={model.state.readOnly}
      className={cx(styles.value, isValuesOpen ? styles.widthWhenOpen : undefined)}
      width="auto"
      value={valueValue}
      filterOption={filterNoOp}
      placeholder={t(
        'grafana-scenes.variables.ad-hoc-filter-renderer.value-select.placeholder-select-value',
        'Select value'
      )}
      options={filteredValueOptions}
      inputValue={valueInputValue}
      onInputChange={onValueInputChange}
      onChange={(v) => {
        if (onAddCustomValue && v.__isNew__) {
          model._updateFilter(filter, onAddCustomValue(v, filter));
        } else {
          model._updateFilter(filter, {
            value: v.value,
            valueLabels: v.label ? [v.label] : [v.value],
          });
        }

        if (valueHasCustomValue !== v.__isNew__) {
          setValueHasCustomValue(v.__isNew__);
        }
      }}
      // there's a bug in react-select where the menu doesn't recalculate its position when the options are loaded asynchronously
      // see https://github.com/grafana/grafana/issues/63558
      // instead, we explicitly control the menu visibility and prevent showing it until the options have fully loaded
      isOpen={isValuesOpen && !isValuesLoading}
      isLoading={isValuesLoading}
      openMenuOnFocus={true}
      onOpenMenu={async () => {
        setIsValuesLoading(true);
        setIsValuesOpen(true);
        const values = await model._getValuesFor(filter);
        setIsValuesLoading(false);
        setValues(values);
        if (valueHasCustomValue) {
          setValueInputValue(valueValue?.label ?? '');
        }
      }}
      onCloseMenu={() => {
        setIsValuesOpen(false);
        setValueInputValue('');
      }}
      {...(isMultiValue && multiValueProps)}
    />
  );

  const keySelect = (
    <Select
      // By changing the key, we reset the Select component,
      // to ensure that the loaded values are shown after they are loaded
      key={`${isValuesLoading ? 'loading' : 'loaded'}`}
      disabled={model.state.readOnly}
      className={cx(styles.key, isKeysOpen ? styles.widthWhenOpen : undefined)}
      width="auto"
      allowCustomValue={model.state.allowCustomValue ?? true}
      createOptionPosition={operatorDefinition?.isRegex ? 'first' : 'last'}
      value={keyValue}
      placeholder={t(
        'grafana-scenes.variables.ad-hoc-filter-renderer.key-select.placeholder-select-label',
        'Select label'
      )}
      options={handleOptionGroups(keys)}
      onChange={(v) => {
        model._updateFilter(filter, {
          key: v.value,
          keyLabel: v.label,
          // clear value if key has changed
          value: '',
          valueLabels: [''],
          values: undefined,
        });
        setUncommittedValue([]);
      }}
      autoFocus={filter.key === ''}
      // there's a bug in react-select where the menu doesn't recalculate its position when the options are loaded asynchronously
      // see https://github.com/grafana/grafana/issues/63558
      // instead, we explicitly control the menu visibility and prevent showing it until the options have fully loaded
      isOpen={isKeysOpen && !isKeysLoading}
      isLoading={isKeysLoading}
      onOpenMenu={async () => {
        setIsKeysOpen(true);
        setIsKeysLoading(true);
        const keys = await model._getKeys(filter.key);
        setIsKeysLoading(false);
        setKeys(keys);
      }}
      onCloseMenu={() => {
        setIsKeysOpen(false);
      }}
      onBlur={() => {
        if (filter.key === '') {
          model._removeFilter(filter);
        }
      }}
      openMenuOnFocus={true}
    />
  );

  const operatorSelect = (
    <Select
      className={cx(styles.operator, {
        [styles.widthWhenOpen]: isOperatorOpen,
      })}
      value={filter.operator}
      disabled={model.state.readOnly}
      options={model._getOperators()}
      onChange={onOperatorChange}
      onOpenMenu={() => {
        setIsOperatorOpen(true);
      }}
      onCloseMenu={() => {
        setIsOperatorOpen(false);
      }}
    />
  );

  if (model.state.layout === 'vertical') {
    if (filter.key) {
      const label = (
        <ControlsLabel layout="vertical" label={filter.key ?? ''} onRemove={() => model._removeFilter(filter)} />
      );

      return (
        <Field label={label} data-testid={`AdHocFilter-${filter.key}`} className={styles.field}>
          <div className={styles.wrapper}>
            {operatorSelect}
            {valueSelect}
          </div>
        </Field>
      );
    } else {
      return (
        <Field
          label={t('grafana-scenes.variables.ad-hoc-filter-renderer.label-select-label', 'Select label')}
          data-testid={`AdHocFilter-${filter.key}`}
          className={styles.field}
        >
          {keySelect}
        </Field>
      );
    }
  }

  return (
    <div className={styles.wrapper} data-testid={`AdHocFilter-${filter.key}`}>
      {keySelect}
      {operatorSelect}
      {valueSelect}
      <Button
        variant="secondary"
        aria-label={t('grafana-scenes.variables.ad-hoc-filter-renderer.aria-label-remove-filter', 'Remove filter')}
        title={t('grafana-scenes.variables.ad-hoc-filter-renderer.title-remove-filter', 'Remove filter')}
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
    '&:first-child': {
      '> :first-child': {
        borderBottomLeftRadius: 0,
        borderTopLeftRadius: 0,
      },
    },
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
  value: css({
    flexBasis: 'content',
    flexShrink: 1,
    minWidth: '90px',
  }),
  key: css({
    flexBasis: 'content',
    minWidth: '90px',
    flexShrink: 1,
  }),
  operator: css({
    flexShrink: 0,
    flexBasis: 'content',
  }),
  removeButton: css({
    paddingLeft: theme.spacing(3 / 2),
    paddingRight: theme.spacing(3 / 2),
    borderLeft: 'none',
    width: theme.spacing(3),
    marginRight: theme.spacing(1),
    boxSizing: 'border-box',
    // To not have button background and last select border intersect
    position: 'relative',
    left: '1px',
  }),
});
