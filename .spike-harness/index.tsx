import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createTheme, SelectableValue } from '@grafana/data';
import { GlobalStyles, ThemeContext } from '@grafana/ui';
import { AdHocFiltersComboboxRenderer } from '../packages/scenes/src/variables/adhoc/AdHocFiltersCombobox/AdHocFiltersComboboxRenderer';
import {
  AdHocFiltersController,
  AdHocFiltersControllerState,
} from '../packages/scenes/src/variables/adhoc/controller/AdHocFiltersController';
import { AdHocFilterWithLabels } from '../packages/scenes/src/variables/adhoc/AdHocFiltersVariable';

class HarnessController implements AdHocFiltersController {
  constructor(
    private filters: AdHocFilterWithLabels[],
    private setFilters: (filters: AdHocFilterWithLabels[]) => void,
    private wip: AdHocFilterWithLabels | undefined,
    private setWip: (wip: AdHocFilterWithLabels | undefined) => void
  ) {}

  useState(): AdHocFiltersControllerState {
    return {
      filters: this.filters,
      wip: this.wip,
      readOnly: false,
      allowCustomValue: false,
      supportsMultiValueOperators: false,
      inputPlaceholder: 'Add a default filter...',
      enableKeyLabelEditing: true,
    };
  }

  async getKeys(): Promise<Array<SelectableValue<string>>> {
    return [
      { label: 'RVP Region', value: 'territory_navigator.rvp_region' },
      { label: 'Account Tier', value: 'territory_navigator.account_tier' },
      { value: 'territory_navigator.raw_key_without_label' },
    ];
  }

  async getValuesFor(): Promise<Array<SelectableValue<string>>> {
    return ['EMEA', 'AMER', 'APAC'].map((v) => ({ label: v, value: v.toLowerCase() }));
  }

  getOperators(): Array<SelectableValue<string>> {
    return [
      { label: '=', value: '=' },
      { label: '!=', value: '!=' },
    ];
  }

  updateFilter(filter: AdHocFilterWithLabels, update: Partial<AdHocFilterWithLabels>): void {
    if (filter === this.wip) {
      if ('value' in update && update['value'] !== '') {
        this.setFilters([...this.filters, { ...this.wip, ...update }]);
        this.setWip(undefined);
      } else {
        this.setWip({ ...this.wip, ...update });
      }
      return;
    }
    this.setFilters(this.filters.map((f) => (f === filter ? { ...f, ...update } : f)));
  }

  updateToMatchAll(filter: AdHocFilterWithLabels): void {
    this.updateFilter(filter, { operator: '=~', value: '.*', matchAllFilter: true });
  }

  removeFilter(filter: AdHocFilterWithLabels): void {
    this.setFilters(this.filters.filter((f) => f !== filter));
  }

  removeLastFilter(): void {
    this.setFilters(this.filters.slice(0, -1));
  }

  handleComboboxBackspace(filter: AdHocFilterWithLabels): void {
    this.removeFilter(filter);
  }

  addWip(): void {
    this.setWip({ key: '', operator: '=', value: '', condition: '' });
  }

  restoreOriginalFilter(): void {}
}

function App() {
  const [filters, setFilters] = useState<AdHocFilterWithLabels[]>([]);
  const [wip, setWip] = useState<AdHocFilterWithLabels | undefined>(undefined);

  const controller = useMemo(() => new HarnessController(filters, setFilters, wip, setWip), [filters, wip]);
  const theme = useMemo(() => createTheme({ colors: { mode: 'dark' } }), []);

  return (
    <ThemeContext.Provider value={theme}>
      <GlobalStyles />
      <div
        style={{
          background: theme.colors.background.canvas,
          color: theme.colors.text.primary,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSize,
          minHeight: '100vh',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        <h4 style={{ marginTop: 0 }}>Default filters (spike: enableKeyLabelEditing)</h4>
        <AdHocFiltersComboboxRenderer controller={controller} />
        <pre data-testid="filters-json" style={{ marginTop: 16, fontSize: 12 }}>
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div>
    </ThemeContext.Provider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
