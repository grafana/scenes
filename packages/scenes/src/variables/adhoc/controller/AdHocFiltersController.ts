import { SelectableValue } from '@grafana/data';
import { AdHocFilterWithLabels, OnAddCustomValueFn } from '../AdHocFiltersVariable';

/**
 * Controller state returned by useState hook
 */
export interface AdHocFiltersControllerState {
  filters: AdHocFilterWithLabels[];
  originFilters?: AdHocFilterWithLabels[];
  readOnly?: boolean;
  allowCustomValue?: boolean;
  supportsMultiValueOperators?: boolean;
  onAddCustomValue?: OnAddCustomValueFn;
  wip?: AdHocFilterWithLabels;
  inputPlaceholder?: string;
  _shouldFocus?: boolean;
}

/**
 * Controller interface for adhoc filters combobox UI.
 * Decouples the UI from AdHocFiltersVariable, allowing usage with or without a variable.
 */
export interface AdHocFiltersController {
  /**
   * React hook to access controller state.
   * Components should call this to get current filters and configuration.
   */
  useState(): AdHocFiltersControllerState;

  /**
   * Get possible keys given current filters.
   * @param currentKey - The key being edited (to exclude from filter context)
   */
  getKeys(currentKey: string | null): Promise<Array<SelectableValue<string>>>;

  /**
   * Get possible values for a specific filter key.
   * @param filter - The filter to get values for
   */
  getValuesFor(filter: AdHocFilterWithLabels): Promise<Array<SelectableValue<string>>>;

  /**
   * Get available operators based on configuration.
   */
  getOperators(): Array<SelectableValue<string>>;

  /**
   * Update a filter with partial changes.
   * @param filter - The filter to update
   * @param update - Partial filter properties to update
   */
  updateFilter(filter: AdHocFilterWithLabels, update: Partial<AdHocFilterWithLabels>): void;

  /**
   * Update a filter to match all values (=~ .*)
   * @param filter - The filter to update
   */
  updateToMatchAll(filter: AdHocFilterWithLabels): void;

  /**
   * Remove a filter.
   * @param filter - The filter to remove
   */
  removeFilter(filter: AdHocFilterWithLabels): void;

  /**
   * Remove the last filter in the list.
   */
  removeLastFilter(): void;

  /**
   * Handle backspace key in combobox (removes filter or navigates to previous).
   * @param filter - The filter where backspace was pressed
   */
  handleComboboxBackspace(filter: AdHocFilterWithLabels): void;

  /**
   * Add a new work-in-progress filter.
   */
  addWip(): void;

  /**
   * Restore an origin filter to its original value.
   * @param filter - The filter to restore
   */
  restoreOriginalFilter(filter: AdHocFilterWithLabels): void;

  /**
   * Optional: Focus the filter input (for combobox layout).
   * This allows external code to programmatically focus the filter input.
   */
  focusInput?(): void;

  /**
   * Reset the focus flag.
   */
  resetFocusFlag?(): void;

  /**
   * Optional: Start profiling an interaction (for performance tracking).
   * @param name - The interaction name
   */
  startProfile?(name: string): void;

  /**
   * Optional: Start tracking an interaction (for analytics).
   * @param name - The interaction name
   */
  startInteraction?(name: string): void;

  /**
   * Optional: Stop tracking the current interaction.
   */
  stopInteraction?(): void;
}
