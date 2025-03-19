import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FloatingFocusManager, FloatingPortal, UseFloatingOptions } from '@floating-ui/react';
import { Spinner, Text, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { AdHocFilterWithLabels, AdHocFiltersVariable, isMultiValueOperator } from '../AdHocFiltersVariable';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  DropdownItem,
  LoadingOptionsPlaceholder,
  MultiValueApplyButton,
  NoOptionsPlaceholder,
  OptionsErrorPlaceholder,
} from './DropdownItem';
import {
  ERROR_STATE_DROPDOWN_WIDTH,
  flattenOptionGroups,
  generateFilterUpdatePayload,
  generatePlaceholder,
  populateInputValueOnInputTypeSwitch,
  setupDropdownAccessibility,
  switchInputType,
  switchToNextInputType,
  VIRTUAL_LIST_ITEM_HEIGHT,
  VIRTUAL_LIST_ITEM_HEIGHT_WITH_DESCRIPTION,
  VIRTUAL_LIST_OVERSCAN,
} from './utils';
import { handleOptionGroups } from '../../utils';
import { useFloatingInteractions, MAX_MENU_HEIGHT } from './useFloatingInteractions';
import { MultiValuePill } from './MultiValuePill';
import { getAdhocOptionSearcher } from '../getAdhocOptionSearcher';

interface AdHocComboboxProps {
  filter?: AdHocFilterWithLabels;
  isAlwaysWip?: boolean;
  model: AdHocFiltersVariable;
  handleChangeViewMode?: (event?: React.MouseEvent, shouldFocusOnPillWrapperOverride?: boolean) => void;
  focusOnWipInputRef?: () => void;
  populateInputOnEdit?: boolean;
}

export type AdHocInputType = 'key' | 'operator' | 'value';

export const AdHocCombobox = forwardRef(function AdHocCombobox(
  { filter, model, isAlwaysWip, handleChangeViewMode, focusOnWipInputRef, populateInputOnEdit }: AdHocComboboxProps,
  parentRef
) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Array<SelectableValue<string>>>([]);
  const [optionsLoading, setOptionsLoading] = useState<boolean>(false);
  const [optionsError, setOptionsError] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [filterInputType, setInputType] = useState<AdHocInputType>(!isAlwaysWip ? 'value' : 'key');
  const [preventFiltering, setPreventFiltering] = useState<boolean>(!isAlwaysWip && filterInputType === 'value');
  const styles = useStyles2(getStyles);
  // control multi values with local state in order to commit all values at once and avoid _wip reset mid creation
  const [filterMultiValues, setFilterMultiValues] = useState<Array<SelectableValue<string>>>([]);
  const [_, setForceRefresh] = useState({});
  const allowCustomValue = model.state.allowCustomValue ?? true;

  const multiValuePillWrapperRef = useRef<HTMLDivElement>(null);

  const hasMultiValueOperator = isMultiValueOperator(filter?.operator || '');
  const isMultiValueEdit = hasMultiValueOperator && filterInputType === 'value';

  // used to identify operator element and prevent dismiss because it registers as outside click
  const operatorIdentifier = useId();

  const listRef = useRef<Array<HTMLElement | null>>([]);
  const disabledIndicesRef = useRef<number[]>([]);
  const filterInputTypeRef = useRef<AdHocInputType>(!isAlwaysWip ? 'value' : 'key');

  const optionsSearcher = useMemo(() => getAdhocOptionSearcher(options), [options]);

  const isLastFilter = useMemo(() => {
    if (isAlwaysWip) {
      return false;
    }

    if (model.state.filters.at(-1) === filter) {
      return true;
    }
    return false;
  }, [filter, isAlwaysWip, model.state.filters]);

  // reset wip filter. Used when navigating away with incomplete wip filer or when selecting wip filter value
  const handleResetWip = useCallback(() => {
    if (isAlwaysWip) {
      model._addWip();
      setInputType('key');
      setInputValue('');
    }
  }, [model, isAlwaysWip]);

  const handleMultiValueFilterCommit = useCallback(
    (
      model: AdHocFiltersVariable,
      filter: AdHocFilterWithLabels,
      filterMultiValues: Array<SelectableValue<string>>,
      preventFocus?: boolean
    ) => {
      if (filterMultiValues.length) {
        const valueLabels: string[] = [];
        const values: string[] = [];
        filterMultiValues.forEach((item) => {
          valueLabels.push(item.label ?? item.value!);
          values.push(item.value!);
        });
        model._updateFilter(filter!, { valueLabels, values, value: values[0] });
        setFilterMultiValues([]);
      }
      if (!preventFocus) {
        setTimeout(() => refs.domReference.current?.focus());
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleLocalMultiValueChange = useCallback((selectedItem: SelectableValue<string>) => {
    setFilterMultiValues((items) => {
      if (items.some((item) => item.value === selectedItem.value)) {
        return items.filter((item) => item.value !== selectedItem.value);
      }
      return [...items, selectedItem];
    });
  }, []);

  const onOpenChange = useCallback<NonNullable<UseFloatingOptions['onOpenChange']>>(
    (nextOpen, _, reason) => {
      setOpen(nextOpen);
      // change from filter edit mode to filter view mode when clicked
      //   outside input or dropdown

      if (reason && ['outside-press', 'escape-key'].includes(reason)) {
        if (isMultiValueEdit) {
          // commit multi value filter values on escape and click-away
          handleMultiValueFilterCommit(model, filter!, filterMultiValues);
        }
        handleResetWip();
        handleChangeViewMode?.();
      }
    },
    [
      filter,
      filterMultiValues,
      handleChangeViewMode,
      handleMultiValueFilterCommit,
      handleResetWip,
      isMultiValueEdit,
      model,
    ]
  );

  // generate ids from multi values in order to prevent outside click based on those ids
  const outsidePressIdsToIgnore = useMemo(() => {
    return [
      operatorIdentifier,
      ...filterMultiValues.reduce<string[]>(
        (acc, item, i) => [...acc, `${item.value}-${i}`, `${item.value}-${i}-close-icon`],
        []
      ),
    ];
  }, [operatorIdentifier, filterMultiValues]);

  const { refs, floatingStyles, context, getReferenceProps, getFloatingProps, getItemProps } = useFloatingInteractions({
    open,
    onOpenChange,
    activeIndex,
    setActiveIndex,
    outsidePressIdsToIgnore,
    listRef,
    disabledIndicesRef,
  });

  // pass ability to focus on input element back to parent
  //     parentRef is coming from AdHocFiltersComboboxRenderer
  useImperativeHandle(parentRef, () => () => refs.domReference.current?.focus(), [refs.domReference]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setInputValue(value);
    setActiveIndex(0);
    if (preventFiltering) {
      setPreventFiltering(false);
    }
  }

  const handleRemoveMultiValue = useCallback(
    (item: SelectableValue<string>) => {
      setFilterMultiValues((selected) => selected.filter((option) => option.value !== item.value));
      setTimeout(() => refs.domReference.current?.focus());
    },
    [refs.domReference]
  );

  // operation order on fetched options:
  //    fuzzy search -> extract into groups -> flatten group labels and options
  const filteredDropDownItems = flattenOptionGroups(
    handleOptionGroups(optionsSearcher(preventFiltering ? '' : inputValue))
  );

  // adding custom option this way so that virtualiser is aware of it and can scroll to
  if (allowCustomValue && filterInputType !== 'operator' && inputValue) {
    filteredDropDownItems.push({
      value: inputValue.trim(),
      label: inputValue.trim(),
      isCustom: true,
    });
  }

  // Get the optional onAddCustomValue method from the AdHocFiltersVariable if defined
  const onAddCustomValue = model.state.onAddCustomValue;

  // calculate width and populate listRef and disabledIndicesRef for arrow key navigation
  const maxOptionWidth = setupDropdownAccessibility(filteredDropDownItems, listRef, disabledIndicesRef);

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

        // if input type changed before fetch completed then abort updating options
        //   this can cause race condition and return incorrect options when input type changed
        if (filterInputTypeRef.current !== inputType) {
          return;
        }
        setOptions(options);
        if (options[0]?.group) {
          setActiveIndex(1);
        } else {
          setActiveIndex(0);
        }
      } catch (e) {
        setOptionsError(true);
      }
      setOptionsLoading(false);
    },
    [filter, model]
  );

  const rowVirtualizer = useVirtualizer({
    count: filteredDropDownItems.length,
    getScrollElement: () => refs.floating.current,
    estimateSize: (index) =>
      filteredDropDownItems[index].description ? VIRTUAL_LIST_ITEM_HEIGHT_WITH_DESCRIPTION : VIRTUAL_LIST_ITEM_HEIGHT,
    overscan: VIRTUAL_LIST_OVERSCAN,
  });

  //
  // Keyboard interactions
  //

  const handleBackspaceInput = useCallback(
    (event: React.KeyboardEvent, multiValueEdit: boolean) => {
      if (event.key === 'Backspace' && !inputValue) {
        if (filterInputType === 'value') {
          if (multiValueEdit) {
            if (filterMultiValues.length) {
              setFilterMultiValues((items) => {
                const updated = [...items];
                updated.splice(-1, 1);

                return updated;
              });
              return;
            }
          }
          setInputType('operator');
          return;
        }

        // focus back on alway wip input when you delete filter with backspace
        focusOnWipInputRef?.();

        model._handleComboboxBackspace(filter!);

        if (isAlwaysWip) {
          handleResetWip();
        }
      }
    },
    [
      inputValue,
      filterInputType,
      model,
      filter,
      isAlwaysWip,
      filterMultiValues.length,
      handleResetWip,
      focusOnWipInputRef,
    ]
  );

  const handleTabInput = useCallback(
    (event: React.KeyboardEvent, multiValueEdit?: boolean) => {
      // change filter to view mode when navigating away with Tab key
      //  this is needed because useDismiss only reacts to mousedown
      if (event.key === 'Tab' && !event.shiftKey) {
        if (multiValueEdit) {
          // commit multi value filter values on tab away
          event.preventDefault();
          handleMultiValueFilterCommit(model, filter!, filterMultiValues);
          refs.domReference.current?.focus();
        }

        handleChangeViewMode?.();
        handleResetWip();
      }
    },
    [
      filter,
      filterMultiValues,
      handleChangeViewMode,
      handleMultiValueFilterCommit,
      handleResetWip,
      model,
      refs.domReference,
    ]
  );

  const handleShiftTabInput = useCallback(
    (event: React.KeyboardEvent, multiValueEdit?: boolean) => {
      if (event.key === 'Tab' && event.shiftKey) {
        if (multiValueEdit) {
          // commit multi value filter values on shift tab away
          event.preventDefault();
          handleMultiValueFilterCommit(model, filter!, filterMultiValues, true);
        }
        handleChangeViewMode?.();
        handleResetWip();
      }
    },
    [filter, filterMultiValues, handleChangeViewMode, handleMultiValueFilterCommit, handleResetWip, model]
  );

  const handleEnterInput = useCallback(
    (event: React.KeyboardEvent, multiValueEdit?: boolean) => {
      if (event.key === 'Enter' && activeIndex != null) {
        // safeguard for non existing items
        // note: custom item is added to filteredDropDownItems if allowed
        if (!filteredDropDownItems[activeIndex]) {
          return;
        }
        const selectedItem = filteredDropDownItems[activeIndex];

        if (multiValueEdit) {
          handleLocalMultiValueChange(selectedItem);
          setInputValue('');
        } else {
          model._updateFilter(
            filter!,
            generateFilterUpdatePayload({
              filterInputType,
              item: selectedItem,
              filter: filter!,
              setFilterMultiValues,
              onAddCustomValue,
            })
          );

          populateInputValueOnInputTypeSwitch({
            populateInputOnEdit,
            item: selectedItem,
            filterInputType,
            setInputValue,
            filter,
          });

          switchToNextInputType(
            filterInputType,
            setInputType,
            handleChangeViewMode,
            refs.domReference.current,
            // preventing focus on filter pill only when last filter for better backspace experience
            isLastFilter ? false : undefined
          );
          setActiveIndex(null);
          if (isLastFilter) {
            focusOnWipInputRef?.();
          }
        }
      }
    },
    [
      activeIndex,
      filteredDropDownItems,
      handleLocalMultiValueChange,
      model,
      filter,
      filterInputType,
      populateInputOnEdit,
      handleChangeViewMode,
      refs.domReference,
      isLastFilter,
      focusOnWipInputRef,
      onAddCustomValue,
    ]
  );

  const handleEditMultiValuePill = useCallback(
    (value: SelectableValue<string>) => {
      const valueLabel = value.label || value.value!;
      setFilterMultiValues((prev) => prev.filter((item) => item.value !== value.value));
      setPreventFiltering(true);
      setInputValue(valueLabel);
      refs.domReference.current?.focus();
      setTimeout(() => {
        refs.domReference.current?.select();
      });
    },
    [refs.domReference]
  );

  //
  // Effects
  //

  useEffect(() => {
    // fetch options when dropdown is opened.
    if (open) {
      handleFetchOptions(filterInputType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filterInputType]);

  // when not in wip mode this is the point of switching from view to edit mode
  //    and in this case we default to 'value' input type and focus input
  useEffect(() => {
    if (!isAlwaysWip) {
      if (hasMultiValueOperator && filter?.values?.length) {
        const multiValueOptions = (filter.values as string[]).reduce<Array<SelectableValue<string>>>(
          (acc, value, i) => [
            ...acc,
            {
              label: filter.valueLabels?.[i] || value,
              value: value,
            },
          ],
          []
        );
        // populate filter multi values to local state on pill edit enter
        setFilterMultiValues(multiValueOptions);
      }

      // populate input when selecting pill for edit
      //   this avoids populating input during delete with backspace
      if (!hasMultiValueOperator && populateInputOnEdit) {
        setInputValue(filter?.valueLabels?.[0] ?? (filter?.value || ''));
        setTimeout(() => {
          refs.domReference.current?.select();
        });
      }

      refs.domReference.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // this is required only with multi value select in order to update position
  //    of the multi value apply button
  useEffect(() => {
    if (isMultiValueEdit && filterMultiValues) {
      setTimeout(() => setForceRefresh({}));
    }
  }, [filterMultiValues, isMultiValueEdit]);

  // synch filterInputTypeRef with filterInputType state
  useLayoutEffect(() => {
    if (filterInputTypeRef.current) {
      filterInputTypeRef.current = filterInputType;
    }
  }, [filterInputType]);

  useLayoutEffect(() => {
    // this is needed to scroll virtual list to the position of currently selected
    //    dropdown item when navigating with arrow up/down keys to end/start of list
    if (
      activeIndex !== null &&
      rowVirtualizer.range &&
      (activeIndex > rowVirtualizer.range?.endIndex || activeIndex < rowVirtualizer.range?.startIndex)
    ) {
      rowVirtualizer.scrollToIndex(activeIndex);
    }
  }, [activeIndex, rowVirtualizer]);

  const keyLabel = filter?.keyLabel ?? filter?.key;

  return (
    <div className={styles.comboboxWrapper}>
      {filter ? (
        <div className={styles.pillWrapper}>
          {/* Filter key pill render */}
          {filter?.key ? <div className={cx(styles.basePill, styles.keyPill)}>{keyLabel}</div> : null}
          {/* Filter operator pill render */}
          {filter?.key && filter?.operator && filterInputType !== 'operator' ? (
            <div
              id={operatorIdentifier}
              className={cx(styles.basePill, styles.operatorPill, operatorIdentifier)}
              role="button"
              aria-label="Edit filter operator"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                setInputValue('');
                switchInputType('operator', setInputType, undefined, refs.domReference.current);
              }}
              onKeyDown={(event) => {
                handleShiftTabInput(event, hasMultiValueOperator);
                if (event.key === 'Enter') {
                  setInputValue('');
                  switchInputType('operator', setInputType, undefined, refs.domReference.current);
                }
              }}
            >
              {filter.operator}
            </div>
          ) : null}

          <div ref={multiValuePillWrapperRef}></div>
          {isMultiValueEdit
            ? filterMultiValues.map((item, i) => (
                <MultiValuePill
                  key={`${item.value}-${i}`}
                  item={item}
                  index={i}
                  handleRemoveMultiValue={handleRemoveMultiValue}
                  handleEditMultiValuePill={handleEditMultiValuePill}
                />
              ))
            : null}
        </div>
      ) : null}

      <input
        {...getReferenceProps({
          ref: refs.setReference,
          onChange,
          value: inputValue,
          // dynamic placeholder to display operator and/or value in filter edit mode
          placeholder: generatePlaceholder(filter!, filterInputType, isMultiValueEdit, isAlwaysWip),
          'aria-autocomplete': 'list',
          onKeyDown(event) {
            if (!open) {
              setOpen(true);
              return;
            }

            if (filterInputType === 'operator') {
              handleShiftTabInput(event);
            }
            handleBackspaceInput(event, isMultiValueEdit);
            handleTabInput(event, isMultiValueEdit);
            handleEnterInput(event, isMultiValueEdit);
          },
        })}
        className={cx(styles.inputStyle, { [styles.loadingInputPadding]: !optionsLoading })}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
        }}
      />
      {optionsLoading ? <Spinner className={styles.loadingIndicator} inline={true} /> : null}
      <FloatingPortal>
        {open && (
          <FloatingFocusManager context={context} initialFocus={-1} visuallyHiddenDismiss modal={false}>
            <>
              <div
                style={{
                  ...floatingStyles,
                  width: `${optionsError ? ERROR_STATE_DROPDOWN_WIDTH : maxOptionWidth}px`,
                  transform: isMultiValueEdit
                    ? `translate(${multiValuePillWrapperRef.current?.getBoundingClientRect().left || 0}px, ${
                        (refs.domReference.current?.getBoundingClientRect().bottom || 0) + 10
                      }px )`
                    : floatingStyles.transform,
                }}
                ref={refs.setFloating}
                className={styles.dropdownWrapper}
                tabIndex={-1}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize() || VIRTUAL_LIST_ITEM_HEIGHT}px`, // fallback to 38px for loading/error/no options placeholders
                  }}
                  {...getFloatingProps()}
                  tabIndex={-1}
                >
                  {optionsLoading ? (
                    <LoadingOptionsPlaceholder />
                  ) : optionsError ? (
                    <OptionsErrorPlaceholder handleFetchOptions={() => handleFetchOptions(filterInputType)} />
                  ) : !filteredDropDownItems.length &&
                    (!allowCustomValue || filterInputType === 'operator' || !inputValue) ? (
                    <NoOptionsPlaceholder />
                  ) : (
                    rowVirtualizer.getVirtualItems().map((virtualItem) => {
                      const item = filteredDropDownItems[virtualItem.index];
                      const index = virtualItem.index;

                      // render group label
                      if (item.options) {
                        return (
                          <div
                            key={`${item.label}+${index}`}
                            className={cx(styles.optionGroupLabel, styles.groupTopBorder)}
                            style={{
                              height: `${virtualItem.size}px`,
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <Text weight="bold" variant="bodySmall" color="secondary">
                              {item.label!}
                            </Text>
                          </div>
                        );
                      }

                      const nextItem: SelectableValue<string> | undefined =
                        filteredDropDownItems[virtualItem.index + 1];
                      const shouldAddBottomBorder = nextItem && !nextItem.group && !nextItem.options && item.group;

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
                              if (isMultiValueEdit) {
                                event.preventDefault();
                                event.stopPropagation();
                                handleLocalMultiValueChange(item);
                                setInputValue('');
                                refs.domReference.current?.focus();
                              } else {
                                model._updateFilter(
                                  filter!,
                                  generateFilterUpdatePayload({
                                    filterInputType,
                                    item,
                                    filter: filter!,
                                    setFilterMultiValues,
                                    onAddCustomValue,
                                  })
                                );

                                populateInputValueOnInputTypeSwitch({
                                  populateInputOnEdit,
                                  item,
                                  filterInputType,
                                  setInputValue,
                                  filter,
                                });

                                switchToNextInputType(
                                  filterInputType,
                                  setInputType,
                                  handleChangeViewMode,
                                  refs.domReference.current,
                                  // explicitly preventing focus on filter pill due to a11y error
                                  false
                                );
                              }
                            },
                          })}
                          active={activeIndex === index}
                          addGroupBottomBorder={shouldAddBottomBorder}
                          // virtual item positioning and accessibility
                          style={{
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                          aria-setsize={filteredDropDownItems.length}
                          aria-posinset={virtualItem.index + 1}
                          isMultiValueEdit={isMultiValueEdit}
                          checked={filterMultiValues.some((val) => val.value === item.value)}
                        >
                          <span>
                            {item.isCustom ? 'Use custom value: ' : ''} {item.label ?? item.value}
                          </span>
                          {item.description ? <div className={styles.descriptionText}>{item.description}</div> : null}
                        </DropdownItem>
                      );
                    })
                  )}
                </div>
              </div>
              {isMultiValueEdit && !optionsLoading && !optionsError && filteredDropDownItems.length ? (
                <MultiValueApplyButton
                  onApply={() => {
                    handleMultiValueFilterCommit(model, filter!, filterMultiValues);
                  }}
                  floatingElement={refs.floating.current}
                  maxOptionWidth={maxOptionWidth}
                  menuHeight={Math.min(rowVirtualizer.getTotalSize(), MAX_MENU_HEIGHT)}
                />
              ) : null}
            </>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </div>
  );
});

const getStyles = (theme: GrafanaTheme2) => ({
  comboboxWrapper: css({
    display: 'flex',
    flexWrap: 'wrap',
  }),
  pillWrapper: css({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
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
    minHeight: theme.spacing(2.75),
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
  dropdownWrapper: css({
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    boxShadow: theme.shadows.z2,
    overflowY: 'auto',
    zIndex: theme.zIndex.dropdown,
  }),
  inputStyle: css({
    paddingBlock: 0,
    '&:focus': {
      outline: 'none',
    },
  }),
  loadingIndicator: css({
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing(0.5),
  }),
  loadingInputPadding: css({
    paddingRight: theme.spacing(2.5),
  }),
  optionGroupLabel: css({
    padding: theme.spacing(1),
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  }),
  groupTopBorder: css({
    '&:not(:first-child)': {
      borderTop: `1px solid ${theme.colors.border.weak}`,
    },
  }),
  descriptionText: css({
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    paddingTop: theme.spacing(0.5),
  }),
});
