import { SelectableValue } from '@grafana/data';
import uFuzzy from '@leeoniya/ufuzzy';
import { flushSync } from 'react-dom';
import { AdHocInputType } from './AdHocFiltersCombobox';
import { AdHocFiltersVariable, AdHocFilterWithLabels } from '../AdHocFiltersVariable';
import { UseFloatingReturn } from '@floating-ui/react';

const VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER = 8;
const VIRTUAL_LIST_PADDING = 8;
export const VIRTUAL_LIST_OVERSCAN = 5;
export const VIRTUAL_LIST_ITEM_HEIGHT = 38;

export function fuzzySearchOptions(options: Array<SelectableValue<string>>) {
  const ufuzzy = new uFuzzy();
  const haystack: string[] = [];

  return (search: string) => {
    if (search === '') {
      return options;
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
      }

      return filteredOptions;
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

    // rough widthEstimate
    const widthEstimate =
      (options[i].isCustom ? label.length + 18 : label.length) * VIRTUAL_LIST_WIDTH_ESTIMATE_MULTIPLIER +
      VIRTUAL_LIST_PADDING * 2;
    if (widthEstimate > maxOptionWidth) {
      maxOptionWidth = widthEstimate;
    }
  }

  listRef.current = [...listRefArr];
  disabledIndicesRef.current = [...disabledIndices];
  return maxOptionWidth;
};

// used for updating inputType concurrently because other bunched updates depend on this being up to date
export const flushSyncInputType = (
  inputType: AdHocInputType,
  setInputType: React.Dispatch<React.SetStateAction<AdHocInputType>>
) =>
  flushSync(() => {
    setInputType(inputType);
  });

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
        model._updateFilter(filter!, filterInputType, options[optionIndex]);
        setInputValue(lastChar);
      }
      flushSync(() => {
        setInputType('operator');
      });
      refs.domReference.current?.focus();
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
          model._updateFilter(filter!, filterInputType, options[optionIndex]);
          setInputValue(lastChar);
        }
        flushSync(() => {
          setInputType('value');
        });
        refs.domReference.current?.focus();
        return;
      }
    }
  }
};
