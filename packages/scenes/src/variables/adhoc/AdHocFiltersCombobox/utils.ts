import { SelectableValue } from '@grafana/data';
import uFuzzy from '@leeoniya/ufuzzy';
import { AdHocInputType } from './AdHocFiltersCombobox';
import { AdHocFilterWithLabels, isMultiValueOperator } from '../AdHocFiltersVariable';

const VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER = 8;
const VIRTUAL_LIST_DESCRIPTION_WIDTH_ESTIMATE_MULTIPLIER = 6;
const VIRTUAL_LIST_PADDING = 8;
export const VIRTUAL_LIST_OVERSCAN = 5;
export const VIRTUAL_LIST_ITEM_HEIGHT = 38;
export const VIRTUAL_LIST_ITEM_HEIGHT_WITH_DESCRIPTION = 60;
export const ERROR_STATE_DROPDOWN_WIDTH = 366;

export function fuzzySearchOptions(options: Array<SelectableValue<string>>) {
  const ufuzzy = new uFuzzy();
  const haystack: string[] = [];
  const limit = 10000;

  return (search: string, filterInputType: AdHocInputType) => {
    if (search === '') {
      if (options.length > limit) {
        return options.slice(0, limit);
      } else {
        return options;
      }
    }

    if (filterInputType === 'operator') {
      const filteredOperators = [];
      for (let i = 0; i < options.length; i++) {
        if ((options[i].label || options[i].value)?.includes(search)) {
          filteredOperators.push(options[i]);
          if (filteredOperators.length > limit) {
            return filteredOperators;
          }
        }
      }
      return filteredOperators;
    }

    if (haystack.length === 0) {
      for (let i = 0; i < options.length; i++) {
        haystack.push(options[i].label || options[i].value!);
      }
    }
    const [idxs, info, order] = ufuzzy.search(haystack, search);
    const filteredOptions: Array<SelectableValue<string>> = [];

    if (idxs) {
      for (let i = 0; i < idxs.length; i++) {
        if (info && order) {
          const idx = order[i];
          filteredOptions.push(options[idxs[idx]]);
        } else {
          filteredOptions.push(options[idxs[i]]);
        }

        if (filteredOptions.length > limit) {
          return filteredOptions;
        }
      }
      return filteredOptions;
    }

    if (options.length > limit) {
      return options.slice(0, limit);
    }

    return options;
  };
}
export const flattenOptionGroups = (options: Array<SelectableValue<string>>) =>
  options.flatMap<SelectableValue<string>>((option) => (option.options ? [option, ...option.options] : [option]));

export const setupDropdownAccessibility = (
  options: Array<SelectableValue<string>>,
  listRef: React.MutableRefObject<Array<HTMLElement | null>>,
  disabledIndicesRef: React.MutableRefObject<number[]>
) => {
  let maxOptionWidth = 182;
  const listRefArr = [];
  const disabledIndices = [];

  for (let i = 0; i < options.length; i++) {
    // listRefArr should be filled with nulls for amount of dropdown items so that
    //    useNavigationList sets activeIndex correctly when navigating with arrow keys
    listRefArr.push(null);

    // disabledIndices are used to skip unselectable group items in dropdown when
    //    navigating with arrow keys
    if (options[i]?.options) {
      disabledIndices.push(i);
    }
    let label = options[i].label ?? options[i].value ?? '';
    let multiplierToUse = VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER;
    if (
      label.length * VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER <
      (options[i].description?.length || 0) * VIRTUAL_LIST_DESCRIPTION_WIDTH_ESTIMATE_MULTIPLIER
    ) {
      label = options[i].description!;
      multiplierToUse = VIRTUAL_LIST_DESCRIPTION_WIDTH_ESTIMATE_MULTIPLIER;
    }

    // rough widthEstimate
    const widthEstimate =
      (options[i].isCustom ? label.length + 18 : label.length) * multiplierToUse + VIRTUAL_LIST_PADDING * 2;
    if (widthEstimate > maxOptionWidth) {
      maxOptionWidth = widthEstimate;
    }
  }

  listRef.current = [...listRefArr];
  disabledIndicesRef.current = [...disabledIndices];
  return maxOptionWidth;
};

const nextInputTypeMap = {
  key: 'operator',
  operator: 'value',
  value: 'key',
} as const;

export const switchToNextInputType = (
  filterInputType: AdHocInputType,
  setInputType: React.Dispatch<React.SetStateAction<AdHocInputType>>,
  handleChangeViewMode: (() => void) | undefined,
  element: HTMLInputElement | null
) =>
  switchInputType(
    nextInputTypeMap[filterInputType],
    setInputType,
    filterInputType === 'value' ? handleChangeViewMode : undefined,
    element
  );

export const switchInputType = (
  filterInputType: AdHocInputType,
  setInputType: React.Dispatch<React.SetStateAction<AdHocInputType>>,
  handleChangeViewMode?: () => void,
  element?: HTMLInputElement | null
) => {
  setInputType(filterInputType);

  handleChangeViewMode?.();

  setTimeout(() => element?.focus());
};

export const generateFilterUpdatePayload = ({
  filterInputType,
  item,
  filter,
  setFilterMultiValues,
}: {
  filterInputType: AdHocInputType;
  item: SelectableValue<string>;
  filter: AdHocFilterWithLabels;
  setFilterMultiValues: (value: React.SetStateAction<Array<SelectableValue<string>>>) => void;
}): Partial<AdHocFilterWithLabels> => {
  if (filterInputType === 'key') {
    return {
      key: item.value,
      keyLabel: item.label ? item.label : item.value,
    };
  }
  if (filterInputType === 'value') {
    return {
      value: item.value,
      valueLabels: [item.label ? item.label : item.value!],
    };
  }

  if (filterInputType === 'operator') {
    // handle values/valueLabels when switching from multi to single value operator
    if (isMultiValueOperator(filter.operator) && !isMultiValueOperator(item.value!)) {
      // reset local multi values state
      setFilterMultiValues([]);
      // update operator and reset values and valueLabels
      return {
        operator: item.value,
        // TODO remove when we're on the latest version of @grafana/data
        //@ts-expect-error
        valueLabels: [filter.valueLabels?.[0] || filter.values?.[0] || filter.value],
        //@ts-expect-error
        values: undefined,
      };
    }

    // handle values/valueLabels when switching from single to multi value operator
    if (isMultiValueOperator(item.value!) && !isMultiValueOperator(filter.operator)) {
      // TODO remove when we're on the latest version of @grafana/data
      //@ts-expect-error
      const valueLabels = [filter.valueLabels?.[0] || filter.values?.[0] || filter.value];
      const values = [filter.value];

      // populate local multi values state
      if (values[0]) {
        setFilterMultiValues([
          {
            value: values[0],
            label: valueLabels?.[0] ?? values[0],
          },
        ]);
      }

      // update operator and default values and valueLabels
      return {
        operator: item.value,
        valueLabels: valueLabels,
        //@ts-expect-error
        values: values,
      };
    }
  }

  // default operator update of same multi/single type
  return {
    [filterInputType]: item.value,
  };
};

const INPUT_PLACEHOLDER = 'Filter by label values';

export const generatePlaceholder = (
  filter: AdHocFilterWithLabels,
  filterInputType: AdHocInputType,
  isMultiValueEdit: boolean,
  isAlwaysWip?: boolean
) => {
  if (filterInputType === 'key') {
    return INPUT_PLACEHOLDER;
  }
  if (filterInputType === 'value') {
    if (isMultiValueEdit) {
      return 'Edit values';
    }
    return filter.valueLabels?.[0] || '';
  }

  return filter[filterInputType] && !isAlwaysWip ? `${filter[filterInputType]}` : INPUT_PLACEHOLDER;
};
