import { SelectableValue } from '@grafana/data';
import uFuzzy from '@leeoniya/ufuzzy';
import { AdHocInputType } from './AdHocFiltersCombobox';
import { AdHocFiltersVariable, AdHocFilterWithLabels } from '../AdHocFiltersVariable';
import { UseFloatingReturn } from '@floating-ui/react';

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
    const idxs = ufuzzy.filter(haystack, search);
    const filteredOptions: Array<SelectableValue<string>> = [];

    if (idxs) {
      for (let i = 0; i < idxs.length; i++) {
        filteredOptions.push(options[idxs[i]]);

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

// WIP: POC for parsing key and operator values automatically
export const filterAutoParser = ({
  event,
  filterInputType,
  options,
  model,
  filter,
  setInputValue,
  setInputType,
  refs,
}: {
  event: React.ChangeEvent<HTMLInputElement>;
  filterInputType: AdHocInputType;
  options: Array<SelectableValue<string>>;
  model: AdHocFiltersVariable;
  filter: AdHocFilterWithLabels | undefined;
  setInputValue: (value: React.SetStateAction<string>) => void;
  setInputType: (value: React.SetStateAction<AdHocInputType>) => void;
  refs: UseFloatingReturn<HTMLInputElement>['refs'];
}) => {
  // // part of POC for seamless filter parser
  if (filterInputType === 'key') {
    const lastChar = event.target.value.slice(-1);
    if (['=', '!', '<', '>'].includes(lastChar)) {
      const key = event.target.value.slice(0, -1);
      const optionIndex = options.findIndex((option) => option.value === key);
      if (optionIndex >= 0) {
        model._updateFilter(filter!, generateFilterUpdatePayload(filterInputType, options[optionIndex]));
        setInputValue(lastChar);
      }
      switchInputType('operator', setInputType, undefined, refs.domReference.current);
      return;
    }
  }
  if (filterInputType === 'operator') {
    const lastChar = event.target.value.slice(-1);
    if (/\w/.test(lastChar)) {
      const operator = event.target.value.slice(0, -1);
      if (!/\w/.test(operator)) {
        const optionIndex = options.findIndex((option) => option.value === operator);
        if (optionIndex >= 0) {
          model._updateFilter(filter!, generateFilterUpdatePayload(filterInputType, options[optionIndex]));
          setInputValue(lastChar);
        }
        switchInputType('value', setInputType, undefined, refs.domReference.current);
        return;
      }
    }
  }
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

export const generateFilterUpdatePayload = (
  filterInputType: AdHocInputType,
  item: SelectableValue<string>
): Partial<AdHocFilterWithLabels> => {
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
