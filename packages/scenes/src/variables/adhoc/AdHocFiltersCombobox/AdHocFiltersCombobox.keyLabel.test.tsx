import React, { useMemo, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectableValue } from '@grafana/data';
import { AdHocFiltersComboboxRenderer } from './AdHocFiltersComboboxRenderer';
import { AdHocFiltersController, AdHocFiltersControllerState } from '../controller/AdHocFiltersController';
import { AdHocFilterWithLabels } from '../AdHocFiltersVariable';

const KEYS: Array<SelectableValue<string>> = [
  { label: 'RVP Region', value: 'territory_navigator.rvp_region' },
  { value: 'raw_key' },
];

const VALUES: Array<SelectableValue<string>> = [
  { label: 'EMEA', value: 'emea' },
  { label: 'AMER', value: 'amer' },
];

const LABEL_STEP_HINT = 'Optional display name - press Enter to continue';
const LABEL_STEP_PLACEHOLDER = 'display name (optional)';

class TestController implements AdHocFiltersController {
  public constructor(
    private filters: AdHocFilterWithLabels[],
    private setFilters: (filters: AdHocFilterWithLabels[]) => void,
    private wip: AdHocFilterWithLabels | undefined,
    private setWip: (wip: AdHocFilterWithLabels | undefined) => void,
    private enableKeyLabelEditing: boolean,
    private updateFilterCalls: Array<Partial<AdHocFilterWithLabels>>
  ) {}

  public useState(): AdHocFiltersControllerState {
    return {
      filters: this.filters,
      wip: this.wip,
      readOnly: false,
      allowCustomValue: true,
      enableKeyLabelEditing: this.enableKeyLabelEditing,
    };
  }

  public async getKeys(): Promise<Array<SelectableValue<string>>> {
    return KEYS;
  }

  public async getValuesFor(): Promise<Array<SelectableValue<string>>> {
    return VALUES;
  }

  public getOperators(): Array<SelectableValue<string>> {
    return [
      { label: '=', value: '=' },
      { label: '!=', value: '!=' },
    ];
  }

  public updateFilter(filter: AdHocFilterWithLabels, update: Partial<AdHocFilterWithLabels>): void {
    this.updateFilterCalls.push(update);

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

  public updateToMatchAll(filter: AdHocFilterWithLabels): void {
    this.updateFilter(filter, { operator: '=~', value: '.*', matchAllFilter: true });
  }

  public removeFilter(filter: AdHocFilterWithLabels): void {
    this.setFilters(this.filters.filter((f) => f !== filter));
  }

  public removeLastFilter(): void {
    this.setFilters(this.filters.slice(0, -1));
  }

  public handleComboboxBackspace(filter: AdHocFilterWithLabels): void {
    this.removeFilter(filter);
  }

  public addWip(): void {
    this.setWip({ key: '', operator: '=', value: '', condition: '' });
  }

  public restoreOriginalFilter(): void {}
}

function setup(enableKeyLabelEditing: boolean) {
  const updateFilterCalls: Array<Partial<AdHocFilterWithLabels>> = [];

  function Harness() {
    const [filters, setFilters] = useState<AdHocFilterWithLabels[]>([]);
    const [wip, setWip] = useState<AdHocFilterWithLabels | undefined>(undefined);

    const controller = useMemo(
      () => new TestController(filters, setFilters, wip, setWip, enableKeyLabelEditing, updateFilterCalls),
      [filters, wip]
    );

    return <AdHocFiltersComboboxRenderer controller={controller} />;
  }

  render(<Harness />);

  return { updateFilterCalls };
}

async function selectKey(name: string) {
  const input = screen.getByRole('combobox');
  await userEvent.click(input);
  expect(await screen.findByRole('option', { name })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('option', { name }));
  return input;
}

describe('AdHocFiltersCombobox key display-name step', () => {
  // jsdom layout mocks for floating-ui positioning and @tanstack/react-virtual measurement
  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        width: 200,
        height: 32,
        top: 0,
        left: 0,
        bottom: 32,
        right: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 480 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 200 });
    globalThis.ResizeObserver ??= class {
      public observe() {}
      public unobserve() {}
      public disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  describe('with enableKeyLabelEditing unset (default)', () => {
    it('never shows the label step: key selection goes straight to operator', async () => {
      const { updateFilterCalls } = setup(false);

      await selectKey('RVP Region');

      // straight to the operator dropdown
      expect(await screen.findByRole('option', { name: '=' })).toBeInTheDocument();
      // no display-name hint or placeholder anywhere in the flow
      expect(screen.queryByText(LABEL_STEP_HINT)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(LABEL_STEP_PLACEHOLDER)).not.toBeInTheDocument();
      // key selection committed only the key payload
      expect(updateFilterCalls).toEqual([
        { key: 'territory_navigator.rvp_region', keyLabel: 'RVP Region', meta: undefined },
      ]);
    });
  });

  describe('with enableKeyLabelEditing set', () => {
    it('shows the label step after key selection, prefilled with the datasource key label', async () => {
      setup(true);

      const input = await selectKey('RVP Region');

      expect(input).toHaveValue('RVP Region');
      expect(input).toHaveAttribute('placeholder', LABEL_STEP_PLACEHOLDER);
      expect(await screen.findByText(LABEL_STEP_HINT)).toBeInTheDocument();
    });

    it('Enter on an unchanged prefill skips without a keyLabel override and moves to operator', async () => {
      const { updateFilterCalls } = setup(true);

      await selectKey('RVP Region');
      await userEvent.keyboard('{Enter}');

      // only the key-selection update was committed, no keyLabel override
      expect(updateFilterCalls).toEqual([
        { key: 'territory_navigator.rvp_region', keyLabel: 'RVP Region', meta: undefined },
      ]);

      // now on the operator step
      expect(await screen.findByRole('option', { name: '=' })).toBeInTheDocument();

      // complete the filter; pill falls back to the datasource label
      await userEvent.click(screen.getByRole('option', { name: '=' }));
      await userEvent.keyboard('{arrowdown}');
      await userEvent.click(await screen.findByRole('option', { name: 'EMEA' }));

      expect(await screen.findByText('RVP Region = EMEA')).toBeInTheDocument();
    });

    it('Enter on an emptied input skips without a keyLabel override', async () => {
      const { updateFilterCalls } = setup(true);

      const input = await selectKey('raw_key');

      // no datasource label for this key, nothing prefilled
      expect(input).toHaveValue('');

      await userEvent.keyboard('{Enter}');

      expect(updateFilterCalls).toEqual([{ key: 'raw_key', keyLabel: 'raw_key', meta: undefined }]);

      await userEvent.click(await screen.findByRole('option', { name: '=' }));
      await userEvent.keyboard('{arrowdown}');
      await userEvent.click(await screen.findByRole('option', { name: 'EMEA' }));

      // pill falls back to the raw key
      expect(await screen.findByText('raw_key = EMEA')).toBeInTheDocument();
    });

    it('commits an edited label as keyLabel and the pill shows the display name', async () => {
      const { updateFilterCalls } = setup(true);

      const input = await selectKey('RVP Region');

      await userEvent.clear(input);
      await userEvent.type(input, 'Region');
      await userEvent.keyboard('{Enter}');

      expect(updateFilterCalls).toContainEqual({ keyLabel: 'Region' });

      await userEvent.click(await screen.findByRole('option', { name: '=' }));
      await userEvent.keyboard('{arrowdown}');
      await userEvent.click(await screen.findByRole('option', { name: 'EMEA' }));

      expect(await screen.findByText('Region = EMEA')).toBeInTheDocument();
    });

    it('Backspace on an empty label input navigates back to the key step', async () => {
      setup(true);

      const input = await selectKey('RVP Region');

      await userEvent.clear(input);
      await userEvent.keyboard('{Backspace}');

      // back on the key step with the wip key reset
      expect(await screen.findByPlaceholderText('+ label = value')).toBeInTheDocument();
      await userEvent.keyboard('{arrowdown}');
      expect(await screen.findByRole('option', { name: 'RVP Region' })).toBeInTheDocument();
    });

    it('Escape during the label step dismisses the flow without trapping the user', async () => {
      setup(true);

      await selectKey('RVP Region');
      await userEvent.keyboard('{Escape}');

      // wip flow resets; the key dropdown is reachable again
      await userEvent.keyboard('{arrowdown}');
      expect(await screen.findByRole('option', { name: 'RVP Region' })).toBeInTheDocument();
      expect(screen.queryByText(LABEL_STEP_HINT)).not.toBeInTheDocument();
    });
  });
});
