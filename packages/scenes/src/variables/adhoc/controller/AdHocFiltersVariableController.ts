import { SelectableValue } from '@grafana/data';
import { AdHocFilterWithLabels, AdHocFiltersVariable } from '../AdHocFiltersVariable';
import { AdHocFiltersController, AdHocFiltersControllerState } from './AdHocFiltersController';
import { getQueryController } from '../../../core/sceneGraph/getQueryController';
import { getInteractionTracker } from '../../../core/sceneGraph/getInteractionTracker';

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
      _shouldFocus: state._shouldFocus,
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

  public focusInput(): void {
    this.model.focusInput();
  }

  public resetFocusFlag(): void {
    this.model._resetFocusFlag();
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
}
