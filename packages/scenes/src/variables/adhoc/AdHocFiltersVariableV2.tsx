import { css, cx } from '@emotion/css';
import { useStyles2, Icon, sharedInputStyle, Button, InputActionMeta, Select, Tag, IconButton } from '@grafana/ui';
import React, { useMemo, useState } from 'react';
import { SceneComponentProps } from '../../core/types';
import { AdHocCombobox } from './AdHocCombobox';
import { AdHocFilterWithLabels, AdHocFiltersVariable } from './AdHocFiltersVariable';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { getOptionSearcher } from '../components/getOptionSearcher';
import { VariableValueOption } from '../types';

export class AdHocFiltersVariableV2 extends AdHocFiltersVariable {
  static Component = AdHocFiltersVariableRendererV2;
}

export function AdHocFiltersVariableRendererV2({ model }: SceneComponentProps<AdHocFiltersVariable>) {
  const { filters } = model.useState();
  const styles = useStyles2(getStyles2);

  console.log(filters);

  return (
    <div className={cx(styles.wrapper, styles.inputStyles)}>
      <Icon name="filter" className={styles.filterIcon} size="lg" />

      {filters.map((filter, index) => (
        <React.Fragment key={index}>
          <Tag name={filter.key} />
          <Tag name={filter.operator} />
          <Tag name={filter.value} />
          <IconButton
            aria-label="delete filter"
            name="times"
            onClick={() => {
              model._removeFilter(filter);
            }}
          />
        </React.Fragment>
      ))}

      <AdHocCombobox model={model} />

      {/* {!readOnly && <AdHocFilterBuilderV2 model={model} key="'builder" addFilterButtonText={addFilterButtonText} />} */}
    </div>
  );
}

const getStyles2 = (theme: GrafanaTheme2) => ({
  inputStyles: cx(sharedInputStyle(theme, false)),
  wrapper: css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    columnGap: theme.spacing(2),
    rowGap: theme.spacing(1),
  }),
  filterIcon: css({
    color: theme.colors.text.secondary,
    alignSelf: 'center',
  }),
});

function selectableValueToVariableValueOption(value: SelectableValue): VariableValueOption {
  return {
    label: value.label ?? String(value.value),
    value: value.value,
  };
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

interface Props {
  filter: AdHocFilterWithLabels;
  model: AdHocFiltersVariable;
}

export function AdHocFilterRendererV2({ filter, model }: Props) {
  const styles = useStyles2(getStyles);

  const [keys, setKeys] = useState<SelectableValue[]>([]);
  const [values, setValues] = useState<SelectableValue[]>([]);
  const [isKeysLoading, setIsKeysLoading] = useState(false);
  const [isValuesLoading, setIsValuesLoading] = useState(false);
  const [isKeysOpen, setIsKeysOpen] = useState(false);
  const [isValuesOpen, setIsValuesOpen] = useState(false);
  const [valueInputValue, setValueInputValue] = useState('');
  const [valueHasCustomValue, setValueHasCustomValue] = useState(false);

  const keyValue = keyLabelToOption(filter.key, filter.keyLabel);
  const valueValue = keyLabelToOption(filter.value, filter.valueLabel);

  const optionSearcher = useMemo(
    () => getOptionSearcher(values.map(selectableValueToVariableValueOption), undefined),
    [values]
  );

  const onValueInputChange = (value: string, { action }: InputActionMeta) => {
    if (action === 'input-change') {
      setValueInputValue(value);
    }
    return value;
  };

  const filteredValueOptions: SelectableValue[] = optionSearcher(valueInputValue);

  const valueSelect = (
    <Select
      virtualized
      allowCustomValue
      isValidNewOption={(inputValue) => inputValue.trim().length > 0}
      allowCreateWhileLoading
      formatCreateLabel={(inputValue) => `Use custom value: ${inputValue}`}
      disabled={model.state.readOnly}
      className={cx(styles.value, isKeysOpen ? styles.widthWhenOpen : undefined)}
      width="auto"
      value={valueValue}
      filterOption={filterNoOp}
      placeholder={'Select value'}
      options={filteredValueOptions}
      inputValue={valueInputValue}
      onInputChange={onValueInputChange}
      onChange={(v) => {
        model._updateFilter(filter, 'value', v);

        if (valueHasCustomValue !== v.__isNew__) {
          setValueHasCustomValue(v.__isNew__);
        }
      }}
      // there's a bug in react-select where the menu doesn't recalculate its position when the options are loaded asynchronously
      // see https://github.com/grafana/grafana/issues/63558
      // instead, we explicitly control the menu visibility and prevent showing it until the options have fully loaded
      isOpen={isValuesOpen && !isValuesLoading}
      isLoading={isValuesLoading}
      autoFocus={filter.key !== '' && filter.value === ''}
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
      components={{ IndicatorsContainer: () => null }}
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
      value={keyValue}
      placeholder={'Select label'}
      options={keys}
      onChange={(v) => model._updateFilter(filter, 'key', v)}
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
      components={{ IndicatorsContainer: () => null }}
    />
  );

  return (
    <div className={styles.wrapper} data-testid={`AdHocFilter-${filter.key}`}>
      {keySelect}
      <Select
        className={styles.operator}
        value={filter.operator}
        disabled={model.state.readOnly}
        options={model._getOperators()}
        width="auto"
        onChange={(v) => model._updateFilter(filter, 'operator', v)}
        components={{ IndicatorsContainer: () => null }}
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
  value: css({
    flexShrink: 1,
  }),
  key: css({
    paddingRight: theme.spacing(1),
    flexShrink: 1,
  }),
  operator: css({
    flexShrink: 0,
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
