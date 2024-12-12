import { useFloating, autoUpdate, offset, flip, size, useRole, useDismiss, useListNavigation, useInteractions } from '@floating-ui/react';

const MAX_MENU_HEIGHT = 300;
const useFloatingInteractions = ({
  open,
  onOpenChange,
  activeIndex,
  setActiveIndex,
  outsidePressIdsToIgnore,
  listRef,
  disabledIndicesRef
}) => {
  const { refs, floatingStyles, context } = useFloating({
    whileElementsMounted: autoUpdate,
    open,
    onOpenChange,
    placement: "bottom-start",
    middleware: [
      offset(10),
      flip({ padding: 10 }),
      size({
        apply({ availableHeight, availableWidth, elements }) {
          elements.floating.style.maxHeight = `${Math.min(MAX_MENU_HEIGHT, availableHeight)}px`;
          elements.floating.style.maxWidth = `${availableWidth}px`;
        },
        padding: 10
      })
    ],
    strategy: "fixed"
  });
  const role = useRole(context, { role: "listbox" });
  const dismiss = useDismiss(context, {
    outsidePress: (event) => {
      var _a;
      if (event.currentTarget instanceof Element) {
        const target = event.currentTarget;
        let idToCompare = target.id;
        if (target.nodeName === "path") {
          idToCompare = ((_a = target.parentElement) == null ? void 0 : _a.id) || "";
        }
        if (outsidePressIdsToIgnore.includes(idToCompare)) {
          return false;
        }
      }
      return true;
    }
  });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true,
    disabledIndices: disabledIndicesRef.current
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([role, dismiss, listNav]);
  return {
    refs,
    floatingStyles,
    context,
    getReferenceProps,
    getFloatingProps,
    getItemProps
  };
};

export { MAX_MENU_HEIGHT, useFloatingInteractions };
//# sourceMappingURL=useFloatingInteractions.js.map
