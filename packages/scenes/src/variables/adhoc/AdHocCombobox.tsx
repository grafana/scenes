import React, { forwardRef, useEffect, useRef, useState } from 'react';
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
import { Tag, getSelectStyles, useTheme2 } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { cx } from '@emotion/css';
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

interface Props {
  filter?: AdHocFilterWithLabels;
  model: AdHocFiltersVariable;
}

export function AdHocCombobox({ filter, model }: Props) {
  const [open, setOpen] = useState(false);
  //   const [optionsLoading, setOptionsLoading] = useState<boolean>(false);
  const [options, setOptions] = useState<Array<SelectableValue<string>>>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<'key' | 'operator' | 'value'>('key');

  const listRef = useRef<Array<HTMLElement | null>>([]);
  const { _wip } = model.useState();

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

    if (value) {
      setOpen(true);
      setActiveIndex(0);
    } else {
      setOpen(false);
    }
  }

  const items = options.filter((item) =>
    (item.label ?? item.value)?.toLocaleLowerCase().startsWith(inputValue.toLowerCase())
  );

  useEffect(() => {
    if (!_wip) {
      model._addWip();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_wip]);

  useEffect(() => {
    console.log(options);
  }, [options]);

  return (
    <>
      {_wip?.key ? <Tag name={_wip.key} /> : null}
      {_wip?.key && _wip?.operator && mode !== 'operator' ? <Tag name={_wip.operator} /> : null}
      {_wip?.key && _wip?.operator && _wip?.value ? <Tag name={_wip.value} /> : null}

      <input
        {...getReferenceProps({
          ref: refs.setReference,
          onChange,
          value: inputValue,
          placeholder: 'Enter value',
          'aria-autocomplete': 'list',
          onKeyDown(event) {
            if (event.key === 'Enter' && activeIndex != null && items[activeIndex]) {
              setInputValue(items[activeIndex].value!);
              setActiveIndex(null);
              setOpen(false);
            }
          },
        })}
        key={mode}
        onFocus={async () => {
          let options: Array<SelectableValue<string>> = [];
          if (mode === 'key') {
            console.log('trigger', mode);
            options = await model._getKeys();
          } else if (mode === 'operator') {
            options = model._getOperators();
          } else if (mode === 'value') {
            options = await model._getValuesFor(_wip!);
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
                      model._updateFilter(_wip!, mode, item);
                      setInputValue('');

                      flushSync(() => {
                        if (mode === 'key') {
                          setMode('operator');
                        } else if (mode === 'operator') {
                          setMode('value');
                        } else if (mode === 'value') {
                          setMode('key');
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
