import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
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
import { IconButton, getSelectStyles, useStyles2, useTheme2 } from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { AdHocFilterWithLabels, AdHocFiltersVariable } from './AdHocFiltersVariable';
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

export function AdHocCombobox({ filter, model, wip, handleChangeViewMode }: AdHocComboboxProps) {
  const [open, setOpen] = useState(false);
  //   const [optionsLoading, setOptionsLoading] = useState<boolean>(false);
  const [options, setOptions] = useState<Array<SelectableValue<string>>>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [inputType, setInputType] = useState<'key' | 'operator' | 'value'>(!wip ? 'value' : 'key');
  const styles = useStyles2(getStyles2);

  const listRef = useRef<Array<HTMLElement | null>>([]);
  const { _wip } = model.useState();

  const filterToUse = filter || _wip;

  const { refs, floatingStyles, context } = useFloating<HTMLInputElement>({
    whileElementsMounted: autoUpdate,
    open,
    onOpenChange: (nextOpen, _, reason) => {
      setOpen(nextOpen);
      if (reason === 'outside-press') {
        handleChangeViewMode?.();
      }
    },
    middleware: [
      flip({ padding: 10 }),
      size({
        apply({ rects, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            maxHeight: `${availableHeight > 256 ? 256 : availableHeight}px`,
          });
        },
        padding: 10,
      }),
    ],
  });

  const role = useRole(context, { role: 'listbox' });
  const dismiss = useDismiss(context, {
    outsidePress: (event) => {
      return !(event as unknown as React.MouseEvent<HTMLElement, MouseEvent>).currentTarget.classList.contains(
        `${filterToUse?.key ?? ''}-operator`
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

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
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

  useEffect(() => {
    if (wip && !_wip) {
      model._addWip();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_wip]);

  useEffect(() => {
    if (!wip && refs.domReference.current) {
      setInputType('value');
      setInputValue('');

      refs.domReference.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {filterToUse ? (
        <div className={styles.pillWrapper}>
          {filterToUse?.key ? <div className={cx(styles.basePill, styles.keyPill)}>{filterToUse.key}</div> : null}
          {filterToUse?.key && filterToUse?.operator && inputType !== 'operator' ? (
            <div
              className={cx(styles.basePill, `${filterToUse?.key ?? ''}-operator`)}
              role="button"
              aria-label="Edit filter operator"
              tabIndex={0}
              onClick={() => {
                flushSync(() => {
                  setInputType('operator');
                });

                refs.domReference.current?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  flushSync(() => {
                    setInputType('operator');
                  });
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
          placeholder: !wip
            ? inputType === 'operator'
              ? `${filterToUse![inputType]} ${filterToUse!.value || ''}`
              : filterToUse![inputType]
            : 'Filter by label values',
          'aria-autocomplete': 'list',
          onKeyDown(event) {
            if (event.key === 'Enter' && activeIndex != null && items[activeIndex]) {
              model._updateFilter(filterToUse!, inputType, items[activeIndex]);
              setInputValue('');

              flushSync(() => {
                if (inputType === 'key') {
                  setInputType('operator');
                } else if (inputType === 'operator') {
                  setInputType('value');
                } else if (inputType === 'value') {
                  setInputType('key');
                  handleChangeViewMode?.();
                }
              });

              refs.domReference.current?.focus();
            }
          },
        })}
        className={styles.inputStyle}
        key={inputType}
        onFocus={async () => {
          let options: Array<SelectableValue<string>> = [];
          if (inputType === 'key') {
            options = await model._getKeys(null);
          } else if (inputType === 'operator') {
            options = model._getOperators();
          } else if (inputType === 'value') {
            options = await model._getValuesFor(filterToUse!);
          }

          setActiveIndex(0);
          setOptions(options);
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
              {items.map((item, index) => (
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

                      flushSync(() => {
                        if (inputType === 'key') {
                          setInputType('operator');
                        } else if (inputType === 'operator') {
                          setInputType('value');
                        } else if (inputType === 'value') {
                          setInputType('key');
                          handleChangeViewMode?.();
                        }
                      });

                      refs.domReference.current?.focus();
                    },
                  })}
                  active={activeIndex === index}
                >
                  {item.label ?? item.value}
                </Item>
              ))}
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </>
  );
}

const getStyles2 = (theme: GrafanaTheme2) => ({
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

interface AdHocFilterEditSwitchProps {
  filter: AdHocFilterWithLabels;
  model: AdHocFiltersVariable;
}

export function AdHocFilterEditSwitch({ filter, model }: AdHocFilterEditSwitchProps) {
  const styles = useStyles2(getStyles3);
  const [viewMode, setViewMode] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleChangeViewMode = useCallback(() => {
    flushSync(() => {
      setViewMode((mode) => !mode);
    });
    if (wrapRef.current) {
      wrapRef.current.focus();
    }
  }, []);

  if (viewMode) {
    return (
      <div
        className={styles.combinedFilterPill}
        onClick={handleChangeViewMode}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleChangeViewMode();
          }
        }}
        role="button"
        aria-label="Edit filter"
        tabIndex={0}
        ref={wrapRef}
      >
        <span>
          {filter.key} {filter.operator} {filter.value}
        </span>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            model._removeFilter(filter);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              model._removeFilter(filter);
            }
          }}
          name="times"
          size="md"
          className={styles.removeButton}
          tooltip="Remove filter"
        />
      </div>
    );
  }

  return <AdHocCombobox filter={filter} model={model} handleChangeViewMode={handleChangeViewMode} />;
}

const getStyles3 = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing(1),
    rowGap: theme.spacing(1),
    minHeight: theme.spacing(4),
    backgroundColor: theme.components.input.background,
    border: `1px solid ${theme.colors.border.strong}`,
    borderRadius: theme.shape.radius.default,
    paddingInline: theme.spacing(1),

    '&:focus-within': {
      outline: '2px dotted transparent',
      outlineOffset: '2px',
      boxShadow: `0 0 0 2px ${theme.colors.background.canvas}, 0 0 0px 4px ${theme.colors.primary.main}`,
      transitionTimingFunction: `cubic-bezier(0.19, 1, 0.22, 1)`,
      transitionDuration: '0.2s',
      transitionProperty: 'outline, outline-offset, box-shadow',
    },
  }),
  filterIcon: css({
    color: theme.colors.text.secondary,
    alignSelf: 'center',
  }),
  combinedFilterPill: css({
    display: 'flex',
    alignItems: 'center',
    background: theme.colors.action.selected,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.125, 0, 0.125, 1),
    color: theme.colors.text.primary,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    minHeight: '22px',
    ...theme.typography.bodySmall,
    fontWeight: theme.typography.fontWeightBold,
    cursor: 'pointer',

    '&:hover': {
      background: theme.colors.emphasize(theme.colors.background.secondary),
    },
  }),
  removeButton: css({
    marginInline: theme.spacing(0.5),
    cursor: 'pointer',
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
});
