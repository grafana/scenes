import React from 'react';
import { act, fireEvent, getAllByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { select } from 'react-select-event';

import { DataSourceSrv, locationService, setDataSourceSrv, setTemplateSrv } from '@grafana/runtime';

import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../../components/layout/SceneFlexLayout';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { TestContextProvider } from '../../../utils/test/TestContextProvider';
import { AdHocFiltersVariable, AdHocFiltersVariableState, getOriginFilterControls } from './AdHocFiltersVariable';
import { AdHocFiltersVariableController } from './controller/AdHocFiltersVariableController';

const getTagKeysSpy = jest.fn();
const getTagValuesSpy = jest.fn();

function setup(overrides?: Partial<AdHocFiltersVariableState>) {
  setDataSourceSrv({
    get() {
      return {
        getTagKeys(options: any) {
          getTagKeysSpy(options);
          return [
            { text: 'region', value: 'region' },
            { text: 'tier', value: 'tier' },
          ];
        },
        getTagValues(options: any) {
          getTagValuesSpy(options);
          return [{ text: 'emea' }, { text: 'amer' }, { text: 'apac' }];
        },
        getRef() {
          return { uid: 'my-ds-uid' };
        },
      };
    },
    getInstanceSettings() {
      return { uid: 'my-ds-uid' };
    },
  } as unknown as DataSourceSrv);

  setTemplateSrv({
    getAdhocFilters: jest.fn().mockReturnValue([]),
  } as any);

  const filtersVar = new AdHocFiltersVariable({
    datasource: { uid: 'my-ds-uid' },
    name: 'Filters',
    filters: [],
    originFiltersRenderMode: 'controls',
    supportsMultiValueOperators: true,
    ...overrides,
  });

  const scene = new EmbeddedScene({
    $timeRange: new SceneTimeRange(),
    $variables: new SceneVariableSet({ variables: [filtersVar] }),
    body: new SceneFlexLayout({
      children: [new SceneFlexItem({ body: new SceneCanvasText({ text: 'hello' }) })],
    }),
  });

  act(() => {
    locationService.push('/');
  });

  // Render the variable component directly (without VariableValueSelectors) so the
  // variable-level label rendered by the host is not part of the test surface
  const { unmount } = render(
    <TestContextProvider scene={scene}>
      <filtersVar.Component model={filtersVar} />
    </TestContextProvider>
  );

  return { filtersVar, unmount };
}

beforeEach(() => {
  getTagKeysSpy.mockClear();
  getTagValuesSpy.mockClear();
});

describe('originFiltersRenderMode: controls', () => {
  it('renders dashboard-origin filters as standalone controls and strips them from the combobox', async () => {
    setup({
      originFilters: [
        { key: 'region', operator: '=', value: 'emea', origin: 'dashboard' },
        { key: 'tier', operator: '=', value: 'gold', origin: 'dashboard' },
      ],
    });

    expect(await screen.findByTestId('origin-filter-control-region')).toBeInTheDocument();
    expect(screen.getByTestId('origin-filter-control-tier')).toBeInTheDocument();

    // No origin pills inside the combobox
    expect(screen.queryByText('region = emea')).not.toBeInTheDocument();
    expect(screen.queryByText('tier = gold')).not.toBeInTheDocument();

    // Bulk combobox still rendered
    expect(screen.getByPlaceholderText('+ label = value')).toBeInTheDocument();
  });

  it('keeps pill rendering for scope-origin filters', async () => {
    setup({
      originFilters: [
        { key: 'region', operator: '=', value: 'emea', origin: 'dashboard' },
        { key: 'env', operator: '=', value: 'prod', origin: 'scope' },
      ],
    });

    expect(await screen.findByTestId('origin-filter-control-region')).toBeInTheDocument();
    expect(screen.queryByTestId('origin-filter-control-env')).not.toBeInTheDocument();
    expect(screen.getByText('env = prod')).toBeInTheDocument();
  });

  it('renders origin filters as pills when the mode is not set', async () => {
    setup({
      originFiltersRenderMode: undefined,
      originFilters: [{ key: 'region', operator: '=', value: 'emea', origin: 'dashboard' }],
    });

    expect(screen.queryByTestId('origin-filter-control-region')).not.toBeInTheDocument();
    expect(await screen.findByText('region = emea')).toBeInTheDocument();
  });

  it('shows the keyLabel as the control label', async () => {
    setup({
      originFilters: [{ key: 'region', keyLabel: 'Region', operator: '=', value: 'emea', origin: 'dashboard' }],
    });

    const control = await screen.findByTestId('origin-filter-control-region');
    expect(control).toHaveTextContent('Region');
  });

  it('renders a label for the bulk combobox using the variable label', async () => {
    setup({
      label: 'My filters',
      originFilters: [{ key: 'region', operator: '=', value: 'emea', origin: 'dashboard' }],
    });

    expect(await screen.findByText('My filters')).toBeInTheDocument();
  });

  it('shows the All placeholder for match-all filters', async () => {
    setup({
      originFilters: [
        {
          key: 'region',
          operator: '=~',
          value: '.*',
          values: ['.*'],
          valueLabels: ['All'],
          matchAllFilter: true,
          origin: 'dashboard',
        },
      ],
    });

    const control = await screen.findByTestId('origin-filter-control-region');
    expect(control).toHaveTextContent('All');
  });

  it('commits selected values with =| on blur', async () => {
    const { filtersVar } = setup({
      originFilters: [{ key: 'region', operator: '=', value: 'emea', origin: 'dashboard' }],
    });

    const control = await screen.findByTestId('origin-filter-control-region');
    const selectEl = getAllByRole(control, 'combobox')[0];

    // OptionWithCheckbox handles onPointerDown (not onClick), so use userEvent pointer events
    await userEvent.click(selectEl);
    const option = await screen.findByRole('option', { name: /amer/ });
    await userEvent.click(option);

    // Selection is uncommitted until blur
    expect(filtersVar.state.originFilters![0].operator).toBe('=');

    fireEvent.focusOut(selectEl);

    await waitFor(() => {
      expect(filtersVar.state.originFilters![0]).toMatchObject({
        operator: '=|',
        values: ['emea', 'amer'],
        restorable: true,
      });
    });
  });

  it('turns the filter into match-all when the selection is cleared', async () => {
    const { filtersVar } = setup({
      originFilters: [{ key: 'region', operator: '=', value: 'emea', origin: 'dashboard' }],
    });

    const control = await screen.findByTestId('origin-filter-control-region');
    const selectEl = getAllByRole(control, 'combobox')[0];

    // Remove the selected value with backspace, then blur to commit
    await userEvent.click(selectEl);
    await userEvent.keyboard('{Backspace}');
    fireEvent.focusOut(selectEl);

    await waitFor(() => {
      expect(filtersVar.state.originFilters![0]).toMatchObject({
        operator: '=~',
        value: '.*',
        matchAllFilter: true,
        restorable: true,
      });
    });
  });

  it('restores the original value via the history button', async () => {
    const { filtersVar } = setup({
      originFilters: [{ key: 'region', operator: '=', value: 'emea', origin: 'dashboard' }],
    });

    act(() => {
      filtersVar.updateToMatchAll(filtersVar.state.originFilters![0]);
    });

    const restoreButton = await screen.findByLabelText('Restore the filter set by this dashboard.');
    await userEvent.click(restoreButton);

    await waitFor(() => {
      expect(filtersVar.state.originFilters![0]).toMatchObject({
        operator: '=',
        value: 'emea',
        restorable: false,
      });
    });

    expect(screen.queryByLabelText('Restore the filter set by this dashboard.')).not.toBeInTheDocument();
  });

  it('commits with = when multi-value operators are not supported', async () => {
    const { filtersVar } = setup({
      supportsMultiValueOperators: false,
      originFilters: [{ key: 'region', operator: '=', value: 'emea', origin: 'dashboard' }],
    });

    const control = await screen.findByTestId('origin-filter-control-region');
    const selectEl = getAllByRole(control, 'combobox')[0];

    await waitFor(() => select(selectEl, 'amer', { container: document.body }));

    await waitFor(() => {
      expect(filtersVar.state.originFilters![0]).toMatchObject({
        operator: '=',
        value: 'amer',
        restorable: true,
      });
    });
  });
});

describe('AdHocFiltersVariableController key stripping', () => {
  function createVariable(overrides?: Partial<AdHocFiltersVariableState>) {
    return new AdHocFiltersVariable({
      datasource: { uid: 'my-ds-uid' },
      filters: [],
      getTagKeysProvider: async () => ({
        replace: true,
        values: [
          { text: 'region', value: 'region' },
          { text: 'tier', value: 'tier' },
          { text: 'env', value: 'env' },
        ],
      }),
      ...overrides,
    });
  }

  it('removes control-rendered keys from key suggestions', async () => {
    const variable = createVariable({
      originFiltersRenderMode: 'controls',
      originFilters: [{ key: 'region', operator: '=', value: 'emea', origin: 'dashboard' }],
    });
    const controller = new AdHocFiltersVariableController(variable);

    const keys = await controller.getKeys(null);

    expect(keys.map((key) => key.value)).toEqual(['tier', 'env']);
  });

  it('keeps all keys when the mode is not active', async () => {
    const variable = createVariable({
      originFilters: [{ key: 'region', operator: '=', value: 'emea', origin: 'dashboard' }],
    });
    const controller = new AdHocFiltersVariableController(variable);

    const keys = await controller.getKeys(null);

    expect(keys.map((key) => key.value)).toEqual(['region', 'tier', 'env']);
  });
});

describe('getOriginFilterControls', () => {
  it('returns only visible dashboard-origin non-groupBy filters when mode is controls', () => {
    const state = {
      layout: 'combobox',
      originFiltersRenderMode: 'controls',
      originFilters: [
        { key: 'region', operator: '=', value: 'emea', origin: 'dashboard' },
        { key: 'env', operator: '=', value: 'prod', origin: 'scope' },
        { key: 'hiddenKey', operator: '=', value: 'x', origin: 'dashboard', hidden: true },
        { key: 'groupKey', operator: 'groupBy', value: '', origin: 'dashboard' },
      ],
    } as unknown as AdHocFiltersVariableState;

    expect(getOriginFilterControls(state).map((filter) => filter.key)).toEqual(['region']);
  });

  it('returns empty when the mode is not controls or the layout is not combobox', () => {
    const originFilters = [{ key: 'region', operator: '=', value: 'emea', origin: 'dashboard' }];

    expect(
      getOriginFilterControls({ layout: 'combobox', originFilters } as unknown as AdHocFiltersVariableState)
    ).toEqual([]);
    expect(
      getOriginFilterControls({
        layout: 'horizontal',
        originFiltersRenderMode: 'controls',
        originFilters,
      } as unknown as AdHocFiltersVariableState)
    ).toEqual([]);
  });
});
