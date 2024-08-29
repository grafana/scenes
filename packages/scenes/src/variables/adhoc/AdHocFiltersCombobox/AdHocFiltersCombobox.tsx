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
import { AdHocFilterWithLabels, AdHocFiltersVariable } from '../AdHocFiltersVariable';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DropdownItem, LoadingOptionsPlaceholder, NoOptionsPlaceholder, OptionsErrorPlaceholder } from './DropdownItem';
import {
  ERROR_STATE_DROPDOWN_WIDTH,
  flattenOptionGroups,
  flushSyncInputType,
  fuzzySearchOptions,
  setupDropdownAccessibility,
  VIRTUAL_LIST_ITEM_HEIGHT,
  VIRTUAL_LIST_OVERSCAN,
} from './utils';
import { handleOptionGroups } from '../../utils';
import { useFloatingInteractions } from './useFloatingInteractions';

interface AdHocComboboxProps {
  filter?: AdHocFilterWithLabels;
  isAlwaysWip?: boolean;
  model: AdHocFiltersVariable;
  handleChangeViewMode?: () => void;
}

export type AdHocInputType = 'key' | 'operator' | 'value';

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
  const styles = useStyles2(getStyles);

  // used to identify operator element and prevent dismiss because it registers as outside click
  const operatorIdentifier = useId();

  const listRef = useRef<Array<HTMLElement | null>>([]);
  const disabledIndicesRef = useRef<number[]>([]);

  const optionsSearcher = useMemo(() => fuzzySearchOptions(options), [options]);

  // reset wip filter. Used when navigating away with incomplete wip filer or when selecting wip filter value
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
      if (reason && ['outside-press', 'escape-key'].includes(reason)) {
        handleResetWip();
        handleChangeViewMode?.();
      }
    },
    [handleChangeViewMode, handleResetWip]
  );

  const { refs, floatingStyles, context, getReferenceProps, getFloatingProps, getItemProps } = useFloatingInteractions({
    open,
    onOpenChange,
    activeIndex,
    setActiveIndex,
    operatorIdentifier,
    listRef,
    disabledIndicesRef,
  });

  // pass ability to focus on input element back to parent
  //     parentRef is coming from AdHocFiltersComboboxRenderer
  useImperativeHandle(parentRef, () => () => refs.domReference.current?.focus(), [refs.domReference]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    // part of POC for seamless filter parser
    // filterAutoParser({ event, filterInputType, options, model, filter, setInputValue, setInputType, refs });

    const value = event.target.value;
    setInputValue(value);
    setActiveIndex(0);
  }

  // operation order on fetched options:
  //    fuzzy search -> extract into groups -> flatten group labels and options
  const filteredDropDownItems = flattenOptionGroups(handleOptionGroups(optionsSearcher(inputValue, filterInputType)));

  // adding custom option this way so that virtualiser is aware of it and can scroll to
  if (filterInputType !== 'operator' && inputValue) {
    filteredDropDownItems.push({
      value: inputValue.trim(),
      label: inputValue.trim(),
      isCustom: true,
    });
  }

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

        setOptions(options);
        if (options[0]?.group) {
          setActiveIndex(1);
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
    estimateSize: () => VIRTUAL_LIST_ITEM_HEIGHT,
    overscan: VIRTUAL_LIST_OVERSCAN,
  });

  //
  // Keyboard interactions
  //

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
        // safeguard for non existing items
        if (!filteredDropDownItems[activeIndex]) {
          return;
        }

        model._updateFilter(filter!, filterInputType, filteredDropDownItems[activeIndex]);
        setInputValue('');
        setActiveIndex(0);

        if (filterInputType === 'key') {
          flushSyncInputType('operator', setInputType);
        } else if (filterInputType === 'operator') {
          flushSyncInputType('value', setInputType);
        } else if (filterInputType === 'value') {
          flushSyncInputType('key', setInputType);

          handleChangeViewMode?.();
        }

        refs.domReference.current?.focus();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIndex, filter, filterInputType, filteredDropDownItems, model]
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
    if (!isAlwaysWip && refs.domReference.current) {
      setInputType('value');
      setInputValue('');

      refs.domReference.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className={styles.comboboxWrapper}>
      {filter ? (
        <div className={styles.pillWrapper}>
          {/* Filter key pill render */}
          {filter?.key ? (
            <div className={cx(styles.basePill, styles.keyPill)}>{filter.keyLabel ?? filter.key}</div>
          ) : null}
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
                flushSyncInputType('operator', setInputType);

                refs.domReference.current?.focus();
              }}
              onKeyDown={(event) => {
                handleShiftTabInput(event);
                if (event.key === 'Enter') {
                  flushSyncInputType('operator', setInputType);
                  refs.domReference.current?.focus();
                }
              }}
            >
              {filter.operator}
            </div>
          ) : null}

          {/* Filter value pill render - currently is not possible to see, will be used with multi value */}
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
        className={cx(styles.inputStyle, { [styles.loadingInputPadding]: !optionsLoading })}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        onFocus={() => {
          setActiveIndex(0);
          setOpen(true);
        }}
      />
      {optionsLoading ? <Spinner className={styles.loadingIndicator} inline={true} /> : null}
      <FloatingPortal>
        {open && (
          <FloatingFocusManager context={context} initialFocus={-1} visuallyHiddenDismiss modal={false}>
            <div
              style={{
                ...floatingStyles,
                width: `${optionsError ? ERROR_STATE_DROPDOWN_WIDTH : maxOptionWidth}px`,
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
                ) : !filteredDropDownItems.length && (filterInputType === 'operator' || !inputValue) ? (
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

                    const nextItem: SelectableValue<string> | undefined = filteredDropDownItems[virtualItem.index + 1];
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
                            model._updateFilter(filter!, filterInputType, item);
                            setInputValue('');

                            if (filterInputType === 'key') {
                              flushSyncInputType('operator', setInputType);
                            } else if (filterInputType === 'operator') {
                              flushSyncInputType('value', setInputType);
                            } else if (filterInputType === 'value') {
                              flushSyncInputType('key', setInputType);
                              handleChangeViewMode?.();
                            }

                            refs.domReference.current?.focus();
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
                      >
                        {item.isCustom ? 'Use custom value: ' : ''} {item.label ?? item.value}
                      </DropdownItem>
                    );
                  })
                )}
              </div>
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </div>
  );
});

const getStyles = (theme: GrafanaTheme2) => ({
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
});
