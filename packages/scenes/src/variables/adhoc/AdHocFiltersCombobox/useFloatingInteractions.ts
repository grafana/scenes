import {
  useFloating,
  autoUpdate,
  offset,
  useRole,
  useDismiss,
  useListNavigation,
  UseFloatingOptions,
  flip,
  size,
  UseListNavigationProps,
  useInteractions,
} from '@floating-ui/react';

type useFloatingInteractionsProps = {
  open: UseFloatingOptions['open'];
  onOpenChange: UseFloatingOptions['onOpenChange'];
  activeIndex: UseListNavigationProps['activeIndex'];
  setActiveIndex: UseListNavigationProps['onNavigate'];
  operatorIdentifier: string;
  listRef: React.MutableRefObject<Array<HTMLElement | null>>;
  disabledIndicesRef: React.MutableRefObject<number[]>;
};

export const useFloatingInteractions = ({
  open,
  onOpenChange,
  activeIndex,
  setActiveIndex,
  operatorIdentifier,
  listRef,
  disabledIndicesRef,
}: useFloatingInteractionsProps) => {
  const { refs, floatingStyles, context } = useFloating<HTMLInputElement>({
    whileElementsMounted: autoUpdate,
    open,
    onOpenChange,
    placement: 'bottom-start',
    middleware: [
      offset(10),
      flip({ padding: 10 }),
      size({
        apply({ availableHeight, availableWidth, elements }) {
          // limit maxHeight and maxWidth of dropdown
          elements.floating.style.maxHeight = `${availableHeight > 300 ? 300 : availableHeight}px`;
          elements.floating.style.maxWidth = `${availableWidth}px`;
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
    disabledIndices: disabledIndicesRef.current,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([role, dismiss, listNav]);

  return {
    refs,
    floatingStyles,
    context,
    getReferenceProps,
    getFloatingProps,
    getItemProps,
  };
};