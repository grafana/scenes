import { SelectableValue } from '@grafana/data';
import { AdHocInputType } from './AdHocFiltersCombobox';
import { AdHocFilterWithLabels, isMultiValueOperator } from '../AdHocFiltersVariable';
import { getFuzzySearcher } from '../../utils';

const VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER = 8;
const VIRTUAL_LIST_DESCRIPTION_WIDTH_ESTIMATE_MULTIPLIER = 6;
const VIRTUAL_LIST_PADDING = 8;
export const VIRTUAL_LIST_OVERSCAN = 5;
export const VIRTUAL_LIST_ITEM_HEIGHT = 38;
export const VIRTUAL_LIST_ITEM_HEIGHT_WITH_DESCRIPTION = 60;
export const ERROR_STATE_DROPDOWN_WIDTH = 366;

export function fuzzySearchOptions(options: Array<SelectableValue<string>>) {
  const haystack = options.map((o) => o.label ?? o.value!);
  const fuzzySearch = getFuzzySearcher(haystack);

  return (search: string, filterInputType: AdHocInputType) => {
    if (filterInputType === 'operator' && search !== '') {
      // uFuzzy can only match non-alphanum chars if quoted
      search = `"${search}"`;
    }

    return fuzzySearch(search).map((i) => options[i]);
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
  handleChangeViewMode: ((event?: React.MouseEvent, shouldFocusOnFilterPill?: boolean) => void) | undefined,
  element: HTMLInputElement | null,
  shouldFocusOnPillWrapperOverride?: boolean
) =>
  switchInputType(
    nextInputTypeMap[filterInputType],
    setInputType,
    filterInputType === 'value' ? handleChangeViewMode : undefined,
    element,
    shouldFocusOnPillWrapperOverride
  );

export const switchInputType = (
  filterInputType: AdHocInputType,
  setInputType: React.Dispatch<React.SetStateAction<AdHocInputType>>,
  handleChangeViewMode?: (event?: React.MouseEvent, shouldFocusOnFilterPill?: boolean) => void,
  element?: HTMLInputElement | null,
  shouldFocusOnPillWrapperOverride?: boolean
) => {
  setInputType(filterInputType);

  handleChangeViewMode?.(undefined, shouldFocusOnPillWrapperOverride);

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
        valueLabels: [filter.valueLabels?.[0] || filter.values?.[0] || filter.value],
        values: undefined,
      };
    }

    // handle values/valueLabels when switching from single to multi value operator
    if (isMultiValueOperator(item.value!) && !isMultiValueOperator(filter.operator)) {
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

export const populateInputValueOnInputTypeSwitch = ({
  populateInputOnEdit,
  item,
  filterInputType,
  setInputValue,
  filter,
}: {
  populateInputOnEdit: boolean | undefined;
  item: SelectableValue<string>;
  filterInputType: AdHocInputType;
  setInputValue: (value: React.SetStateAction<string>) => void;
  filter: AdHocFilterWithLabels | undefined;
}) => {
  if (populateInputOnEdit && !isMultiValueOperator(item.value || '') && nextInputTypeMap[filterInputType] === 'value') {
    setInputValue(filter?.value || '');
  } else {
    setInputValue('');
  }
};

export const calculateCollapseThreshold = (
  shouldCollapse: boolean,
  filtersLength: number,
  wrapperRef: React.RefObject<HTMLDivElement>
) => {
  if (!shouldCollapse || !wrapperRef.current) {
    return null;
  }

  const rect = wrapperRef.current.getBoundingClientRect();

  // without paddings variable wrapper height is 26px
  //   therefore trigger only when higher than that
  if (rect.height - 6 > 26) {
    const componentLineSpan = (rect.height - 6) / 26;
    // magic number but dividing filters by line span +1 should yield
    //   number of filters that will fit in 1 line
    const filterCutOff = Math.max(1, Math.floor(filtersLength / (componentLineSpan + 1)));

    return filterCutOff;
  }

  return null;
};
