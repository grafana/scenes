import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  autoUpdate,
  size,
  flip,
  useId,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
  FloatingFocusManager,
  FloatingPortal,
} from '@floating-ui/react';
import { getSelectStyles, useStyles2, useTheme2 } from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { AdHocFilterWithLabels, AdHocFiltersVariable } from '../AdHocFiltersVariable';
import { flushSync } from 'react-dom';

interface ItemProps {
  children: React.ReactNode;
  active: boolean;
}

// eslint-disable-next-line react/display-name
const Item = forwardRef<HTMLDivElement, ItemProps & React.HTMLProps<HTMLDivElement>>(
  ({ children, active, ...rest }, ref) => {
    const theme = useTheme2();
    const selectStyles = getSelectStyles(theme);
    const id = useId();
    return (
      <div
        ref={ref}
        role="option"
        id={id}
        aria-selected={active}
        className={cx(selectStyles.option, active && selectStyles.optionFocused)}
        {...rest}
      >
        <div className={selectStyles.optionBody} data-testid={`data-testid ad hoc filter option value ${children}`}>
          <span>{children}</span>
        </div>
      </div>
    );
  }
);

interface AdHocComboboxProps {
  filter?: AdHocFilterWithLabels;
  wip?: boolean;
  model: AdHocFiltersVariable;
  handleChangeViewMode?: () => void;
}

type AdHocInputType = 'key' | 'operator' | 'value';

export const AdHocCombobox = forwardRef(function AdHocCombobox(
  { filter, model, wip, handleChangeViewMode }: AdHocComboboxProps,
  parentRef
) {
  const [open, setOpen] = useState(false);

  const [options, setOptions] = useState<Array<SelectableValue<string>>>([]);
  const [optionsLoading, setOptionsLoading] = useState<boolean>(false);
  const [optionsError, setOptionsError] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [inputType, setInputType] = useState<AdHocInputType>(!wip ? 'value' : 'key');
  const styles = useStyles2(getStyles2);

  const listRef = useRef<Array<HTMLElement | null>>([]);
  const { _wip } = model.useState();

  const handleResetWip = useCallback(() => {
    if (wip) {
      model._addWip();
      setInputType('key');
      setInputValue('');
    }
  }, [model, wip]);

  const filterToUse = filter || _wip;

  const operatorIdentifier = `${filterToUse?.key ?? ''}-operator`;

  const { refs, floatingStyles, context } = useFloating<HTMLInputElement>({
    whileElementsMounted: autoUpdate,
    open,
    onOpenChange: (nextOpen, _, reason) => {
      setOpen(nextOpen);
      // change from filter edit mode to filter view mode when clicked
      //   outside input or dropdown
      if (['outside-press', 'escape-key'].includes(reason || '')) {
        handleResetWip();
        handleChangeViewMode?.();
      }
    },
    middleware: [
      flip({ padding: 10 }),
      size({
        apply({ rects, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            // limit the maxHeight of dropdown
            maxHeight: `${availableHeight > 256 ? 256 : availableHeight}px`,
          });
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
    // part of POC for seamless filter parser
    if (inputType === 'key') {
      const lastChar = event.target.value.slice(-1);
      if (['=', '!', '<', '>'].includes(lastChar)) {
        const key = event.target.value.slice(0, -1);
        const optionIndex = options.findIndex((option) => option.value === key);
        if (optionIndex >= 0) {
          model._updateFilter(filterToUse!, inputType, options[optionIndex]);
          setInputValue(lastChar);
        }
        flushSync(() => {
          setInputType('operator');
        });
        refs.domReference.current?.focus();
        return;
      }
    }
    if (inputType === 'operator') {
      const lastChar = event.target.value.slice(-1);
      if (/\w/.test(lastChar)) {
        const operator = event.target.value.slice(0, -1);
        if (!/\w/.test(operator)) {
          const optionIndex = options.findIndex((option) => option.value === operator);
          if (optionIndex >= 0) {
            model._updateFilter(filterToUse!, inputType, options[optionIndex]);
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

    const value = event.target.value;
    setInputValue(value);
    setActiveIndex(0);
  }

  const items = options.filter((item) =>
    (item.label ?? item.value)?.toLocaleLowerCase().startsWith(inputValue.toLowerCase())
  );

  const flushInputType = useCallback((inputType: AdHocInputType) => {
    flushSync(() => {
      setInputType(inputType);
    });
  }, []);

  // when combobox is in wip mode then check and add _wip if its missing
  //    needed on first render and when _wip is reset on filter value commit
  useEffect(() => {
    if (wip && !_wip) {
      model._addWip();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_wip]);

  // when not in wip mode this is the point of switching from view to edit mode
  //    and in this case we default to 'value' input type and focus input
  useEffect(() => {
    if (!wip && refs.domReference.current) {
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
          options = await model._getValuesFor(filterToUse!);
        }
        setOptions(options);
      } catch (e) {
        setOptionsError(true);
      }
      setOptionsLoading(false);
    },
    [filterToUse, model]
  );

  const handleBackspaceInput = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Backspace' && !inputValue && inputType === 'key') {
        model._removeLastFilter();
        handleFetchOptions(inputType);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputValue, inputType]
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
      if (event.key === 'Enter' && activeIndex != null && items[activeIndex]) {
        model._updateFilter(filterToUse!, inputType, items[activeIndex]);
        setInputValue('');
        setActiveIndex(0);

        if (inputType === 'key') {
          flushInputType('operator');
        } else if (inputType === 'operator') {
          flushInputType('value');
        } else if (inputType === 'value') {
          flushInputType('key');

          handleChangeViewMode?.();
        }

        refs.domReference.current?.focus();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIndex, filterToUse, inputType, items, model]
  );

  useEffect(() => {
    if (open) {
      handleFetchOptions(inputType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, inputType]);

  return (
    <div className={styles.comboboxWrapper}>
      {filterToUse ? (
        <div className={styles.pillWrapper}>
          {filterToUse?.key ? <div className={cx(styles.basePill, styles.keyPill)}>{filterToUse.key}</div> : null}
          {filterToUse?.key && filterToUse?.operator && inputType !== 'operator' ? (
            <div
              className={cx(styles.basePill, styles.operatorPill, operatorIdentifier)}
              role="button"
              aria-label="Edit filter operator"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                flushInputType('operator');

                refs.domReference.current?.focus();
              }}
              onKeyDown={(event) => {
                handleShiftTabInput(event);
                if (event.key === 'Enter') {
                  flushInputType('operator');
                  refs.domReference.current?.focus();
                }
              }}
            >
              {filterToUse.operator}
            </div>
          ) : null}
          {filterToUse?.key &&
          filterToUse?.operator &&
          filterToUse?.value &&
          !['operator', 'value'].includes(inputType) ? (
            <div className={cx(styles.basePill, styles.valuePill)}>{filterToUse.value}</div>
          ) : null}
        </div>
      ) : null}

      <input
        {...getReferenceProps({
          ref: refs.setReference,
          onChange,
          value: inputValue,
          // dynamic placeholder to display operator and/or value in filter edit mode
          placeholder: !wip
            ? inputType === 'operator'
              ? `${filterToUse![inputType]} ${filterToUse!.value || ''}`
              : filterToUse![inputType]
            : 'Filter by label values',
          'aria-autocomplete': 'list',
          onKeyDown(event) {
            if (inputType === 'operator') {
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
                },
              })}
              className={styles.dropdownWrapper}
            >
              {optionsLoading ? (
                <LoadingOptionsPlaceholder />
              ) : optionsError ? (
                <OptionsErrorPlaceholder handleFetchOptions={() => handleFetchOptions(inputType)} />
              ) : !items.length ? (
                <NoOptionsPlaceholder />
              ) : (
                items.map((item, index) => (
                  // eslint-disable-next-line react/jsx-key
                  <Item
                    {...getItemProps({
                      key: item.value!,
                      ref(node) {
                        listRef.current[index] = node;
                      },
                      onClick() {
                        model._updateFilter(filterToUse!, inputType, item);
                        setInputValue('');

                        if (inputType === 'key') {
                          flushInputType('operator');
                        } else if (inputType === 'operator') {
                          flushInputType('value');
                        } else if (inputType === 'value') {
                          flushInputType('key');
                          handleChangeViewMode?.();
                        }

                        refs.domReference.current?.focus();
                      },
                    })}
                    active={activeIndex === index}
                  >
                    {item.label ?? item.value}
                  </Item>
                ))
              )}
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </div>
  );
});

const LoadingOptionsPlaceholder = () => {
  return <Item active={false}>Loading options...</Item>;
};

const NoOptionsPlaceholder = () => {
  return <Item active={false}>No options found</Item>;
};

const OptionsErrorPlaceholder = ({ handleFetchOptions }: { handleFetchOptions: () => void }) => {
  return (
    <Item active={false} onClick={handleFetchOptions}>
      Error. Click to try again!
    </Item>
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
