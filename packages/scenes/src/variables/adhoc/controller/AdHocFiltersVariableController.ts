import { SelectableValue } from '@grafana/data';
import { isArray } from 'lodash';
import { AdHocFilterWithLabels, AdHocFiltersVariable, removeNthOccurrence } from '../AdHocFiltersVariable';
import { AdHocFiltersController, AdHocFiltersControllerState } from './AdHocFiltersController';
import { getQueryController } from '../../../core/sceneGraph/getQueryController';
import { getInteractionTracker } from '../../../core/sceneGraph/getInteractionTracker';
import type { GroupByVariable } from '../../groupby/GroupByVariable';

/**
 * Adapter that wraps AdHocFiltersVariable to implement the AdHocFiltersController interface.
 * This allows the combobox UI to work with the variable while keeping the UI decoupled.
 */
export class AdHocFiltersVariableController implements AdHocFiltersController {
  public constructor(private model: AdHocFiltersVariable) {}

  public useState(): AdHocFiltersControllerState {
    const state = this.model.useState();

    return {
      filters: state.filters,
      originFilters: state.originFilters,
      readOnly: state.readOnly,
      allowCustomValue: state.allowCustomValue,
      supportsMultiValueOperators: state.supportsMultiValueOperators,
      onAddCustomValue: state.onAddCustomValue,
      wip: state._wip,
      collapsible: state.collapsible,
      valueRecommendations: this.model.getRecommendations(),
      drilldownRecommendationsEnabled: state.drilldownRecommendationsEnabled,
      pillOrder: state.pillOrder,
    };
  }

  public async getKeys(currentKey: string | null): Promise<Array<SelectableValue<string>>> {
    return this.model._getKeys(currentKey);
  }

  public async getValuesFor(filter: AdHocFilterWithLabels): Promise<Array<SelectableValue<string>>> {
    return this.model._getValuesFor(filter);
  }

  public getOperators(): Array<SelectableValue<string>> {
    return this.model._getOperators();
  }

  public updateFilter(filter: AdHocFilterWithLabels, update: Partial<AdHocFilterWithLabels>): void {
    this.model._updateFilter(filter, update);
  }

  public updateFilters(
    filters: AdHocFilterWithLabels[],
    options?: {
      skipPublish?: boolean;
      forcePublish?: boolean;
    }
  ): void {
    this.model.updateFilters(filters, options);
  }

  public updateToMatchAll(filter: AdHocFilterWithLabels): void {
    this.model.updateToMatchAll(filter);
  }

  public removeFilter(filter: AdHocFilterWithLabels): void {
    this.model._removeFilter(filter);
  }

  public removeLastFilter(): void {
    this.model._removeLastFilter();
  }

  public handleComboboxBackspace(filter: AdHocFilterWithLabels): void {
    this.model._handleComboboxBackspace(filter);
  }

  public addWip(): void {
    this.model._addWip();
  }

  public restoreOriginalFilter(filter: AdHocFilterWithLabels): void {
    this.model.restoreOriginalFilter(filter);
  }

  public clearAll(): void {
    this.model.clearAll();
  }

  public startProfile(name: string): void {
    const queryController = getQueryController(this.model);
    queryController?.startProfile(name);
  }

  public startInteraction(name: string): void {
    const interactionTracker = getInteractionTracker(this.model);
    interactionTracker?.startInteraction(name);
  }

  public stopInteraction(): void {
    const interactionTracker = getInteractionTracker(this.model);
    interactionTracker?.stopInteraction();
  }

  public getGroupByVariable(): GroupByVariable | undefined {
    return this.model.state.groupByVariable;
  }

  public addGroupByValue(key: string, keyLabel?: string): void {
    const groupBy = this.model.state.groupByVariable;
    if (!groupBy) {
      return;
    }

    const currentValues = isArray(groupBy.state.value)
      ? groupBy.state.value.map(String)
      : groupBy.state.value
      ? [String(groupBy.state.value)]
      : [];
    const currentTexts = isArray(groupBy.state.text)
      ? groupBy.state.text.map(String)
      : groupBy.state.text
      ? [String(groupBy.state.text)]
      : [];

    if (!currentValues.includes(key)) {
      const newValues = [...currentValues.filter((v) => v !== ''), key];
      const newTexts = [...currentTexts.filter((t) => t !== ''), keyLabel ?? key];

      groupBy.changeValueTo(newValues, newTexts, true);

      const basePillOrder = this._getOrInitPillOrder(groupBy);
      this.model.setState({ pillOrder: [...basePillOrder, 'groupby'] });

      this._syncGroupByAfterChange(groupBy, newValues);
    }
  }

  public removeGroupByValue(key: string): void {
    const groupBy = this.model.state.groupByVariable;
    if (!groupBy) {
      return;
    }

    const currentValues = isArray(groupBy.state.value) ? groupBy.state.value.map(String) : [];
    const currentTexts = isArray(groupBy.state.text) ? groupBy.state.text.map(String) : [];

    const idx = currentValues.indexOf(key);
    if (idx >= 0) {
      const newValues = [...currentValues];
      const newTexts = [...currentTexts];
      newValues.splice(idx, 1);
      newTexts.splice(idx, 1);

      const basePillOrder = this._getOrInitPillOrder(groupBy);
      const updatedPillOrder = removeNthOccurrence(basePillOrder, 'groupby', idx);
      groupBy.changeValueTo(newValues, newTexts, true);
      this.model.setState({ pillOrder: updatedPillOrder });
      this._syncGroupByAfterChange(groupBy, newValues);
    }
  }

  public convertFilterToGroupBy(filter: AdHocFilterWithLabels): void {
    const groupBy = this.model.state.groupByVariable;
    if (!groupBy) {
      return;
    }

    const filterIndex = this.model.state.filters.indexOf(filter);
    if (filterIndex < 0) {
      return;
    }

    // Replace the 'filter' entry at this position with 'groupby' in pillOrder,
    // and count how many 'groupby' entries precede it to determine the correct
    // insertion index in the GroupByVariable's values array.
    const basePillOrder = this._getOrInitPillOrder(groupBy);
    const updatedPillOrder = [...basePillOrder];
    let filterCount = 0;
    let groupByInsertIndex = 0;
    for (let i = 0; i < updatedPillOrder.length; i++) {
      if (updatedPillOrder[i] === 'filter') {
        if (filterCount === filterIndex) {
          updatedPillOrder[i] = 'groupby';
          break;
        }
        filterCount++;
      } else if (updatedPillOrder[i] === 'groupby') {
        groupByInsertIndex++;
      }
    }

    // Remove the filter
    const updatedFilters = this.model.state.filters.filter((f) => f !== filter);

    // Insert the key into GroupBy at the correct position (not appended at end)
    const currentValues = isArray(groupBy.state.value)
      ? groupBy.state.value.map(String)
      : groupBy.state.value
      ? [String(groupBy.state.value)]
      : [];
    const currentTexts = isArray(groupBy.state.text)
      ? groupBy.state.text.map(String)
      : groupBy.state.text
      ? [String(groupBy.state.text)]
      : [];

    if (!currentValues.includes(filter.key)) {
      const cleanValues = currentValues.filter((v) => v !== '');
      const cleanTexts = currentTexts.filter((t) => t !== '');
      const newValues = [...cleanValues];
      const newTexts = [...cleanTexts];
      newValues.splice(groupByInsertIndex, 0, filter.key);
      newTexts.splice(groupByInsertIndex, 0, filter.keyLabel ?? filter.key);
      groupBy.changeValueTo(newValues, newTexts, true);
      this._syncGroupByAfterChange(groupBy, newValues);
    }

    this.model.updateFilters(updatedFilters);
    this.model.setState({ pillOrder: updatedPillOrder });
  }

  /**
   * Returns the current pillOrder, initializing it from existing state if needed.
   * This ensures pre-existing filters and groupBy values get entries in pillOrder
   * before new items are appended.
   */
  private _getOrInitPillOrder(groupBy: GroupByVariable): Array<'filter' | 'groupby'> {
    if (this.model.state.pillOrder && this.model.state.pillOrder.length > 0) {
      return this.model.state.pillOrder;
    }

    const groupByValues = isArray(groupBy.state.value)
      ? groupBy.state.value.map(String).filter((v) => v !== '')
      : groupBy.state.value
      ? [String(groupBy.state.value)]
      : [];

    const filterEntries: Array<'filter' | 'groupby'> = this.model.state.filters
      .filter((f) => !f.hidden)
      .map(() => 'filter' as const);
    const groupByEntries: Array<'filter' | 'groupby'> = groupByValues.map(() => 'groupby' as const);

    return [...filterEntries, ...groupByEntries];
  }

  public getLastPillType(): 'filter' | 'groupby' | undefined {
    const groupBy = this.model.state.groupByVariable;
    if (!groupBy) {
      return this.model.state.filters.length > 0 ? 'filter' : undefined;
    }

    const pillOrder = this._getOrInitPillOrder(groupBy);
    if (pillOrder.length === 0) {
      return undefined;
    }
    return pillOrder[pillOrder.length - 1];
  }

  public popLastGroupByValue(): { key: string; keyLabel: string } | undefined {
    const groupBy = this.model.state.groupByVariable;
    if (!groupBy) {
      return undefined;
    }

    const currentValues = isArray(groupBy.state.value) ? groupBy.state.value.map(String) : [];
    const currentTexts = isArray(groupBy.state.text) ? groupBy.state.text.map(String) : [];

    if (currentValues.length === 0 || (currentValues.length === 1 && currentValues[0] === '')) {
      return undefined;
    }

    // Find the index of the last 'groupby' in pillOrder
    const basePillOrder = this._getOrInitPillOrder(groupBy);
    let lastGroupByPillIndex = -1;
    let groupByCount = 0;
    for (let i = basePillOrder.length - 1; i >= 0; i--) {
      if (basePillOrder[i] === 'groupby') {
        lastGroupByPillIndex = i;
        // Count how many 'groupby' entries are BEFORE this one to find value index
        groupByCount = 0;
        for (let j = 0; j < i; j++) {
          if (basePillOrder[j] === 'groupby') {
            groupByCount++;
          }
        }
        break;
      }
    }

    if (lastGroupByPillIndex < 0) {
      return undefined;
    }

    const valueIndex = groupByCount;
    const key = currentValues[valueIndex];
    const keyLabel = currentTexts[valueIndex] ?? key;

    // Remove from GroupBy values
    const newValues = [...currentValues];
    const newTexts = [...currentTexts];
    newValues.splice(valueIndex, 1);
    newTexts.splice(valueIndex, 1);

    // Remove from pillOrder
    const updatedPillOrder = [...basePillOrder];
    updatedPillOrder.splice(lastGroupByPillIndex, 1);

    groupBy.changeValueTo(newValues, newTexts, true);
    this.model.setState({ pillOrder: updatedPillOrder });
    this._syncGroupByAfterChange(groupBy, newValues);

    return { key, keyLabel };
  }

  /**
   * After changing GroupBy values through the AdHoc UI, we need to sync the
   * restorable flag (for URL sync with defaultValue) and trigger applicability
   * verification + recent grouping storage (normally done onBlur in the GroupBy renderer).
   */
  private _syncGroupByAfterChange(groupBy: GroupByVariable, newValues: string[]): void {
    // Update the restorable flag so URL sync correctly handles defaultValue
    if (groupBy.state.defaultValue) {
      const restorable = groupBy.checkIfRestorable(newValues);
      if (restorable !== groupBy.state.restorable) {
        groupBy.setState({ restorable });
      }
    }

    // Trigger applicability check and recent grouping storage
    groupBy._verifyApplicabilityAndStoreRecentGrouping();
  }
}
