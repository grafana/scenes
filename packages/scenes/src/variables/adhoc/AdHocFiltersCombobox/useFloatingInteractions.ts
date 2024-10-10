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
  outsidePressIdsToIgnore: string[];
  listRef: React.MutableRefObject<Array<HTMLElement | null>>;
  disabledIndicesRef: React.MutableRefObject<number[]>;
};

export const MAX_MENU_HEIGHT = 300;

export const useFloatingInteractions = ({
  open,
  onOpenChange,
  activeIndex,
  setActiveIndex,
  outsidePressIdsToIgnore,
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
          elements.floating.style.maxHeight = `${Math.min(MAX_MENU_HEIGHT, availableHeight)}px`;
          elements.floating.style.maxWidth = `${availableWidth}px`;
        },
        padding: 10,
      }),
    ],
    strategy: 'fixed',
  });

  const role = useRole(context, { role: 'listbox' });
  const dismiss = useDismiss(context, {
    // if outside click lands on operator pill, then ignore outside click
    outsidePress: (event) => {
      if (event.currentTarget instanceof Element) {
        const target = event.currentTarget;
        let idToCompare = target.id;
        if (target.nodeName === 'path') {
          idToCompare = target.parentElement?.id || '';
        }

        if (outsidePressIdsToIgnore.includes(idToCompare)) {
          return false;
        }
      }
      return true;
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
