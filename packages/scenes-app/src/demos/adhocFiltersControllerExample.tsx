import { SelectableValue } from '@grafana/data';
import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  AdHocFiltersComboboxRenderer,
  AdHocFiltersController,
  AdHocFiltersControllerState,
  AdHocFilterWithLabels,
} from '@grafana/scenes';
import React, { useMemo, useState } from 'react';

const OPERATORS = [
  { label: '=', value: '=' },
  { label: '!=', value: '!=' },
];

/**
 * Simple controller implementation for demonstration purposes
 */
export class SimpleController implements AdHocFiltersController {
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
      inputPlaceholder: 'Filter by vowels or consonants...',
    };
  }

  async getKeys(currentKey: string | null): Promise<Array<SelectableValue<string>>> {
    // Return available keys: vowels and consonants
    return [
      { label: 'vowels', value: 'vowels' },
      { label: 'consonants', value: 'consonants' },
    ];
  }

  async getValuesFor(filter: AdHocFilterWithLabels): Promise<Array<SelectableValue<string>>> {
    // Return values based on the key
    if (filter.key === 'vowels') {
      return ['a', 'e', 'i', 'o', 'u'].map((v) => ({ label: v, value: v }));
    } else if (filter.key === 'consonants') {
      return [
        'b',
        'c',
        'd',
        'f',
        'g',
        'h',
        'j',
        'k',
        'l',
        'm',
        'n',
        'p',
        'q',
        'r',
        's',
        't',
        'v',
        'w',
        'x',
        'y',
        'z',
      ].map((v) => ({ label: v, value: v }));
    }
    return [];
  }

  getOperators(): Array<SelectableValue<string>> {
    // Return available operators
    return OPERATORS.map((op) => ({ label: op.value, value: op.value }));
  }

  updateFilter(filter: AdHocFilterWithLabels, update: Partial<AdHocFilterWithLabels>): void {
    if (filter === this.wip) {
      // If we set value we are done with this "work in progress" filter and we can add it
      if ('value' in update && update['value'] !== '') {
        this.setFilters([...this.filters, { ...this.wip, ...update }]);
        this.setWip(undefined);
      } else {
        this.setWip({ ...this.wip, ...update });
      }
      return;
    }

    const updatedFilters = this.filters.map((f) => (f === filter ? { ...f, ...update } : f));
    this.setFilters(updatedFilters);
  }

  updateToMatchAll(filter: AdHocFilterWithLabels): void {
    this.updateFilter(filter, { operator: '=~', value: '.*', matchAllFilter: true });
  }

  removeFilter(filter: AdHocFilterWithLabels): void {
    const updatedFilters = this.filters.filter((f) => f !== filter);
    this.setFilters(updatedFilters);
  }

  removeLastFilter(): void {
    if (this.filters.length > 0) {
      const updatedFilters = this.filters.slice(0, -1);
      this.setFilters(updatedFilters);
    }
  }

  handleComboboxBackspace(filter: AdHocFilterWithLabels): void {
    // Handle backspace - for now just remove the filter
    this.removeFilter(filter);
  }

  addWip(): void {
    // Add a new work-in-progress filter
    const newFilter: AdHocFilterWithLabels = {
      key: '',
      operator: '=',
      value: '',
      condition: '',
    };
    this.setWip(newFilter);
  }

  restoreOriginalFilter(filter: AdHocFilterWithLabels): void {
    // Not applicable for this simple demo
  }
}

/**
 * Demo component renderer that uses SimpleController
 */
function SimpleControllerDemoRenderer({ model }: SceneComponentProps<SimpleControllerDemo>) {
  const [filters, setFilters] = useState<AdHocFilterWithLabels[]>([
    { key: 'vowels', operator: '=', value: 'a', condition: '' },
  ]);
  const [wip, setWip] = useState<AdHocFilterWithLabels | undefined>(undefined);

  const controller = useMemo(() => new SimpleController(filters, setFilters, wip, setWip), [filters, wip]);

  return (
    <>
      <AdHocFiltersComboboxRenderer controller={controller} />
      <div style={{ marginTop: '16px' }}>
        <h4>Current filters:</h4>
        <pre>{JSON.stringify(filters, null, 2)}</pre>
      </div>
    </>
  );
}

/**
 * Demo component that uses SimpleController
 */
export class SimpleControllerDemo extends SceneObjectBase<SceneObjectState> {
  static Component = SimpleControllerDemoRenderer;
}
