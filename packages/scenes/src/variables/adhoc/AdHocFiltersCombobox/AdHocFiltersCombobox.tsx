import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  autoUpdate,
  size,
  flip,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  UseFloatingOptions,
} from '@floating-ui/react';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { AdHocFilterWithLabels, AdHocFiltersVariable } from '../AdHocFiltersVariable';
import { flushSync } from 'react-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DropdownItem } from './DropdownItem';
import { fuzzySearchOptions } from './fuzzySearchOptions';

interface AdHocComboboxProps {
  filter?: AdHocFilterWithLabels;
  isAlwaysWip?: boolean;
  model: AdHocFiltersVariable;
  handleChangeViewMode?: () => void;
}

type AdHocInputType = 'key' | 'operator' | 'value';

export const AdHocCombobox = forwardRef(function AdHocCombobox(
  { filter, model, isAlwaysWip, handleChangeViewMode }: AdHocComboboxProps,
  parentRef
) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Array<SelectableValue<string>>>([]);
  const [optionsLoading, setOptionsLoading] = useState<boolean>(false);
  const [optionsError, setOptionsError] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [filterInputType, setInputType] = useState<AdHocInputType>(!isAlwaysWip ? 'value' : 'key');
  const styles = useStyles2(getStyles2);

  const listRef = useRef<Array<HTMLElement | null>>([]);

  const optionsSearcher = useMemo(() => fuzzySearchOptions(options), [options]);

  const handleResetWip = useCallback(() => {
    if (isAlwaysWip) {
      model._addWip();
      setInputType('key');
      setInputValue('');
    }
  }, [model, isAlwaysWip]);

  const onOpenChange = useCallback<NonNullable<UseFloatingOptions['onOpenChange']>>(
    (nextOpen, _, reason) => {
      setOpen(nextOpen);
      // change from filter edit mode to filter view mode when clicked
      //   outside input or dropdown
      if (['outside-press', 'escape-key'].includes(reason || '')) {
        handleResetWip();
        handleChangeViewMode?.();
      }
    },
    [handleChangeViewMode, handleResetWip]
  );

  const operatorIdentifier = `${filter?.key ?? ''}-operator`;

  const { refs, floatingStyles, context } = useFloating<HTMLInputElement>({
    whileElementsMounted: autoUpdate,
    open,
    onOpenChange,
    placement: 'bottom-start',
    middleware: [
      offset(10),
      flip({ padding: 10 }),
      size({
        apply({ availableHeight, elements }) {
          // limit the maxHeight of dropdown
          elements.floating.style.maxHeight = `${availableHeight > 300 ? 300 : availableHeight}px`;
        },
        padding: 10,
      }),
    ],
  });

  const role = useRole(context, { role: 'listbox' });
  const dismiss = useDismiss(context, {
    // if outside click lands on operator pill, then ignore outside click
    outsidePress: (event) => {
      return !(event as unknown as React.MouseEvent<HTMLElement, MouseEvent>).currentTarget.classList.contains(
        operatorIdentifier
      );
    },
  });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([role, dismiss, listNav]);

  // pass ability to focus on input element back to parent
  useImperativeHandle(parentRef, () => () => refs.domReference.current?.focus(), [refs.domReference]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    // // part of POC for seamless filter parser
    // if (filterInputType === 'key') {
    //   const lastChar = event.target.value.slice(-1);
    //   if (['=', '!', '<', '>'].includes(lastChar)) {
    //     const key = event.target.value.slice(0, -1);
    //     const optionIndex = options.findIndex((option) => option.value === key);
    //     if (optionIndex >= 0) {
    //       model._updateFilter(filterToUse!, filterInputType, options[optionIndex]);
    //       setInputValue(lastChar);
    //     }
    //     flushSync(() => {
    //       setInputType('operator');
    //     });
    //     refs.domReference.current?.focus();
    //     return;
    //   }
    // }
    // if (filterInputType === 'operator') {
    //   const lastChar = event.target.value.slice(-1);
    //   if (/\w/.test(lastChar)) {
    //     const operator = event.target.value.slice(0, -1);
    //     if (!/\w/.test(operator)) {
    //       const optionIndex = options.findIndex((option) => option.value === operator);
    //       if (optionIndex >= 0) {
    //         model._updateFilter(filterToUse!, filterInputType, options[optionIndex]);
    //         setInputValue(lastChar);
    //       }
    //       flushSync(() => {
    //         setInputType('value');
    //       });
    //       refs.domReference.current?.focus();
    //       return;
    //     }
    //   }
    // }

    const value = event.target.value;
    setInputValue(value);
    setActiveIndex(0);
  }

  const filteredDropDownItems = optionsSearcher(inputValue);

  const flushSyncInputType = useCallback((inputType: AdHocInputType) => {
    flushSync(() => {
      setInputType(inputType);
    });
  }, []);

  // when not in wip mode this is the point of switching from view to edit mode
  //    and in this case we default to 'value' input type and focus input
  useEffect(() => {
    if (!isAlwaysWip && refs.domReference.current) {
      setInputType('value');
      setInputValue('');

      refs.domReference.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFetchOptions = useCallback(
    async (inputType: AdHocInputType) => {
      setOptionsError(false);
      setOptionsLoading(true);
      setOptions([]);
      let options: Array<SelectableValue<string>> = [];
      try {
        if (inputType === 'key') {
          options = await model._getKeys(null);
        } else if (inputType === 'operator') {
          options = model._getOperators();
        } else if (inputType === 'value') {
          options = await model._getValuesFor(filter!);
        }
        setOptions(options);
      } catch (e) {
        setOptionsError(true);
      }
      setOptionsLoading(false);
    },
    [filter, model]
  );

  const handleBackspaceInput = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Backspace' && !inputValue && filterInputType === 'key') {
        model._removeLastFilter();
        handleFetchOptions(filterInputType);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputValue, filterInputType]
  );

  const handleTabInput = useCallback((event: React.KeyboardEvent) => {
    // change filter to view mode when navigating away with Tab key
    //  this is needed because useDismiss only reacts to mousedown
    if (event.key === 'Tab' && !event.shiftKey) {
      handleChangeViewMode?.();
      handleResetWip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShiftTabInput = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Tab' && event.shiftKey) {
      handleChangeViewMode?.();
      handleResetWip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnterInput = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && activeIndex != null) {
        // dropDownItems[activeIndex] can be undefined if we entering custom value only
        //  therefore adding a guard for other filterInputTypes
        if (filterInputType !== 'value' && !filteredDropDownItems[activeIndex]) {
          return;
        }

        let dropdownItem = filteredDropDownItems[activeIndex];

        // if we entering value and match no items in dropdown then
        //   allow to enter current input value
        if (filterInputType === 'value' && !filteredDropDownItems[activeIndex]) {
          // prevent from adding empty value
          if (!inputValue.trim()) {
            return;
          }
          dropdownItem = { value: inputValue };
        }

        model._updateFilter(filter!, filterInputType, dropdownItem);
        setInputValue('');
        setActiveIndex(0);

        if (filterInputType === 'key') {
          flushSyncInputType('operator');
        } else if (filterInputType === 'operator') {
          flushSyncInputType('value');
        } else if (filterInputType === 'value') {
          flushSyncInputType('key');

          handleChangeViewMode?.();
        }

        refs.domReference.current?.focus();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIndex, filter, filterInputType, filteredDropDownItems, model]
  );

  useEffect(() => {
    if (open) {
      handleFetchOptions(filterInputType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filterInputType]);

  const rowVirtualizer = useVirtualizer({
    count: filteredDropDownItems.length,
    getScrollElement: () => refs.floating.current,
    estimateSize: () => 38,
    overscan: 5,
  });

  return (
    <div className={styles.comboboxWrapper}>
      {filter ? (
        <div className={styles.pillWrapper}>
          {filter?.key ? (
            <div className={cx(styles.basePill, styles.keyPill)}>{filter.keyLabel ?? filter.key}</div>
          ) : null}
          {filter?.key && filter?.operator && filterInputType !== 'operator' ? (
            <div
              className={cx(styles.basePill, styles.operatorPill, operatorIdentifier)}
              role="button"
              aria-label="Edit filter operator"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                flushSyncInputType('operator');

                refs.domReference.current?.focus();
              }}
              onKeyDown={(event) => {
                handleShiftTabInput(event);
                if (event.key === 'Enter') {
                  flushSyncInputType('operator');
                  refs.domReference.current?.focus();
                }
              }}
            >
              {filter.operator}
            </div>
          ) : null}
          {filter?.key && filter?.operator && filter?.value && !['operator', 'value'].includes(filterInputType) ? (
            <div className={cx(styles.basePill, styles.valuePill)}>{filter.valueLabel ?? filter.value}</div>
          ) : null}
        </div>
      ) : null}

      <input
        {...getReferenceProps({
          ref: refs.setReference,
          onChange,
          value: inputValue,
          // dynamic placeholder to display operator and/or value in filter edit mode
          placeholder: !isAlwaysWip
            ? filterInputType === 'operator'
              ? `${filter![filterInputType]} ${filter!.valueLabel || ''}`
              : filter![filterInputType]
            : 'Filter by label values',
          'aria-autocomplete': 'list',
          onKeyDown(event) {
            if (!open) {
              setOpen(true);
              return;
            }
            if (filterInputType === 'operator') {
              handleShiftTabInput(event);
            }
            handleBackspaceInput(event);
            handleTabInput(event);
            handleEnterInput(event);
          },
        })}
        className={styles.inputStyle}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        onFocus={() => {
          setActiveIndex(0);
          setOpen(true);
        }}
      />
      <FloatingPortal>
        {open && (
          <FloatingFocusManager context={context} initialFocus={-1} visuallyHiddenDismiss>
            <div
              {...getFloatingProps({
                ref: refs.setFloating,
                style: {
                  ...floatingStyles,
                  overflowY: 'auto',
                  zIndex: 1,
                },
              })}
              className={styles.dropdownWrapper}
            >
              {optionsLoading ? (
                <LoadingOptionsPlaceholder />
              ) : optionsError ? (
                <OptionsErrorPlaceholder handleFetchOptions={() => handleFetchOptions(filterInputType)} />
              ) : !filteredDropDownItems.length && filterInputType !== 'value' ? (
                <NoOptionsPlaceholder />
              ) : (
                <>
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const item = filteredDropDownItems[virtualItem.index];
                    const index = virtualItem.index;

                    return (
                      // key is included in getItemProps()
                      // eslint-disable-next-line react/jsx-key
                      <DropdownItem
                        {...getItemProps({
                          key: `${item.value!}-${index}`,
                          ref(node) {
                            listRef.current[index] = node;
                          },
                          onClick(event) {
                            if (filterInputType !== 'value') {
                              event.stopPropagation();
                            }
                            model._updateFilter(filter!, filterInputType, item);
                            setInputValue('');

                            if (filterInputType === 'key') {
                              flushSyncInputType('operator');
                            } else if (filterInputType === 'operator') {
                              flushSyncInputType('value');
                            } else if (filterInputType === 'value') {
                              flushSyncInputType('key');
                              handleChangeViewMode?.();
                            }

                            refs.domReference.current?.focus();
                          },
                        })}
                        active={activeIndex === index}
                      >
                        {item.label ?? item.value}
                      </DropdownItem>
                    );
                  })}
                  {filterInputType === 'value' && inputValue ? (
                    <DropdownItem
                      {...getItemProps({
                        key: '__custom_value_list_item',
                        ref(node) {
                          listRef.current[filteredDropDownItems.length ? filteredDropDownItems.length + 1 : 0] = node;
                        },
                        onClick() {
                          model._updateFilter(filter!, filterInputType, { value: inputValue, label: inputValue });
                          setInputValue('');

                          flushSyncInputType('key');

                          handleChangeViewMode?.();
                          refs.domReference.current?.focus();
                        },
                      })}
                      active={activeIndex === (filteredDropDownItems.length ? filteredDropDownItems.length + 1 : 0)}
                    >
                      Use custom value: {inputValue}
                    </DropdownItem>
                  ) : null}
                </>
              )}
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </div>
  );
});

const LoadingOptionsPlaceholder = () => {
  return <DropdownItem active={false}>Loading options...</DropdownItem>;
};

const NoOptionsPlaceholder = () => {
  return <DropdownItem active={false}>No options found</DropdownItem>;
};

const OptionsErrorPlaceholder = ({ handleFetchOptions }: { handleFetchOptions: () => void }) => {
  return (
    <DropdownItem active={false} onClick={handleFetchOptions}>
      Error. Click to try again!
    </DropdownItem>
  );
};

const getStyles2 = (theme: GrafanaTheme2) => ({
  comboboxWrapper: css({
    display: 'flex',
    flexWrap: 'nowrap',
  }),
  pillWrapper: css({
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  }),
  basePill: css({
    display: 'flex',
    alignItems: 'center',
    background: theme.colors.action.disabledBackground,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.125, 1, 0.125, 1),
    color: theme.colors.text.primary,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    minHeight: '22px',
    ...theme.typography.bodySmall,
    cursor: 'pointer',
  }),
  keyPill: css({
    fontWeight: theme.typography.fontWeightBold,
    cursor: 'default',
  }),
  operatorPill: css({
    '&:hover': {
      background: theme.colors.action.hover,
    },
  }),
  valuePill: css({
    background: theme.colors.action.selected,
  }),
  dropdownWrapper: css({
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    boxShadow: theme.shadows.z2,
  }),
  inputStyle: css({
    paddingBlock: 0,
    '&:focus': {
      outline: 'none',
    },
  }),
});
