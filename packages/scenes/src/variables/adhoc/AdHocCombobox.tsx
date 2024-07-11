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
        style={{
          background: active ? 'lightblue' : 'none',
          padding: 4,
          cursor: 'default',
          ...rest.style,
        }}
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
    onOpenChange: setOpen,
    middleware: [
      flip({ padding: 10 }),
      size({
        apply({ rects, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            maxHeight: `${availableHeight}px`,
          });
        },
        padding: 10,
      }),
    ],
  });

  const role = useRole(context, { role: 'listbox' });
  const dismiss = useDismiss(context);
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([role, dismiss, listNav]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
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
      setInputValue(filter?.value || '');

      refs.domReference.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {filterToUse ? (
        <div className={styles.pillWrapper}>
          {filterToUse?.key ? <div className={cx(styles.basePill, styles.boldText)}>{filterToUse.key}</div> : null}
          {filterToUse?.key && filterToUse?.operator && inputType !== 'operator' ? (
            <div className={styles.basePill}>{filterToUse.operator}</div>
          ) : null}
          {filterToUse?.key && filterToUse?.operator && filterToUse?.value && inputType !== 'value' ? (
            <div className={cx(styles.basePill, styles.valuePill)}>{filterToUse.value}</div>
          ) : null}
        </div>
      ) : null}

      <input
        {...getReferenceProps({
          ref: refs.setReference,
          onChange,
          value: inputValue,
          placeholder: 'Enter value',
          'aria-autocomplete': 'list',
          //   onKeyDown(event) {
          //     if (event.key === 'Enter' && activeIndex != null && items[activeIndex]) {
          //       setInputValue(items[activeIndex].value!);
          //       setActiveIndex(null);
          //       setOpen(false);
          //     }
          //   },
        })}
        onBlur={() => {
          handleChangeViewMode?.();
        }}
        onFocus={async () => {
          console.log('trigger', inputType);
          let options: Array<SelectableValue<string>> = [];
          if (inputType === 'key') {
            options = await model._getKeys(null);
          } else if (inputType === 'operator') {
            options = model._getOperators();
          } else if (inputType === 'value') {
            console.log('trigger values');
            console.log('filterToUse', filterToUse);

            options = await model._getValuesFor(filterToUse!);
          }
          console.log(options);

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
                  background: '#eee',
                  color: 'black',
                  overflowY: 'auto',
                },
              })}
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
  }),
  boldText: css({
    fontWeight: theme.typography.fontWeightBold,
  }),
  valuePill: css({
    background: theme.colors.action.selected,
  }),
});

interface AdHocFilterEditSwitchProps {
  filter: AdHocFilterWithLabels;
  model: AdHocFiltersVariable;
}

export function AdHocFilterEditSwitch({ filter, model }: AdHocFilterEditSwitchProps) {
  const styles = useStyles2(getStyles3);
  const [viewMode, setViewMode] = useState(true);

  const handleChangeViewMode = useCallback(() => {
    setViewMode((mode) => !mode);
  }, []);

  if (viewMode) {
    return (
      <div className={styles.combinedFilterPill} onClick={handleChangeViewMode}>
        <span>
          {filter.key} {filter.operator} {filter.value}
        </span>
        <IconButton
          onClick={() => {
            model._removeFilter(filter);
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
