import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AdHocFilterWithLabels } from '../AdHocFiltersVariable';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';

interface UseEditablePillOptions {
  filter: AdHocFilterWithLabels;
  controller: AdHocFiltersController;
  readOnly?: boolean;
  focusOnWipInputRef?: () => void;
  isFilterEmpty?: (filter: AdHocFilterWithLabels) => boolean;
}

export function useEditablePill({
  filter,
  controller,
  readOnly,
  focusOnWipInputRef,
  isFilterEmpty,
}: UseEditablePillOptions) {
  const [viewMode, setViewMode] = useState(true);
  const [shouldFocusOnPillWrapper, setShouldFocusOnPillWrapper] = useState(false);
  const pillWrapperRef = useRef<HTMLDivElement>(null);
  const [populateInputOnEdit, setPopulateInputOnEdit] = useState(false);

  const handleChangeViewMode = useCallback(
    (event?: React.MouseEvent, shouldFocusOnPillWrapperOverride?: boolean) => {
      event?.stopPropagation();
      if (readOnly) {
        return;
      }

      setShouldFocusOnPillWrapper(shouldFocusOnPillWrapperOverride ?? !viewMode);
      setViewMode(!viewMode);
    },
    [readOnly, viewMode]
  );

  useEffect(() => {
    if (shouldFocusOnPillWrapper) {
      pillWrapperRef.current?.focus();
      setShouldFocusOnPillWrapper(false);
    }
  }, [shouldFocusOnPillWrapper]);

  useEffect(() => {
    if (filter.forceEdit && viewMode) {
      setViewMode(false);
      controller.updateFilter(filter, { forceEdit: undefined });
    }
  }, [filter, controller, viewMode]);

  useEffect(() => {
    if (viewMode) {
      setPopulateInputOnEdit((prevValue) => (prevValue ? false : prevValue));
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode && !readOnly && isFilterEmpty?.(filter)) {
      controller.removeFilter(filter);
      setTimeout(() => focusOnWipInputRef?.());
    }
  }, [controller, filter, focusOnWipInputRef, readOnly, viewMode, isFilterEmpty]);

  const handlePillClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPopulateInputOnEdit(true);
      handleChangeViewMode();
    },
    [handleChangeViewMode]
  );

  const handlePillKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        setPopulateInputOnEdit(true);
        handleChangeViewMode();
      }
    },
    [handleChangeViewMode]
  );

  return {
    viewMode,
    pillWrapperRef,
    populateInputOnEdit,
    handleChangeViewMode,
    handlePillClick,
    handlePillKeyDown,
  };
}
