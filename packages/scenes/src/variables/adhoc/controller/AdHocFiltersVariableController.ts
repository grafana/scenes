import { SelectableValue } from '@grafana/data';
import { isArray } from 'lodash';
import { AdHocFilterWithLabels, AdHocFiltersVariable } from '../AdHocFiltersVariable';
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
      inputPlaceholder: state.inputPlaceholder,
      collapsible: state.collapsible,
      valueRecommendations: this.model.getRecommendations(),
      drilldownRecommendationsEnabled: state.drilldownRecommendationsEnabled,
      forceEditGroupBy: state._forceEditGroupBy,
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

  public clearForceEditGroupBy(): void {
    this.model.setState({ _forceEditGroupBy: false });
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
      groupBy.changeValueTo(newValues, newTexts, true);
      this._syncGroupByAfterChange(groupBy, newValues);
    }
  }

  private _syncGroupByAfterChange(groupBy: GroupByVariable, newValues: string[]): void {
    if (groupBy.state.defaultValue) {
      const restorable = groupBy.checkIfRestorable(newValues);
      if (restorable !== groupBy.state.restorable) {
        groupBy.setState({ restorable });
      }
    }
    groupBy._verifyApplicabilityAndStoreRecentGrouping();
  }
}
