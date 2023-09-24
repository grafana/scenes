import { act, getAllByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { select } from 'react-select-event';

import { DataSourceSrv, setDataSourceSrv, setTemplateSrv } from '@grafana/runtime';

import { EmbeddedScene } from '../../components/EmbeddedScene';
import { VariableValueSelectors } from '../components/VariableValueSelectors';
import { SceneFlexLayout } from '../../components/layout/SceneFlexLayout';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';

const templateSrv = {
  getAdhocFilters: jest.fn().mockReturnValue([{ key: 'origKey', operator: '=', value: '' }]),
} as any;

describe('AdHocFilter', () => {
  it('renders filters', async () => {
    setup();
    expect(screen.getByText('key1')).toBeInTheDocument();
    expect(screen.getByText('val1')).toBeInTheDocument();
    expect(screen.getByText('key2')).toBeInTheDocument();
    expect(screen.getByText('val2')).toBeInTheDocument();
  });

  it('templateSrv.getAdhocFilters patch calls original when scene object is not active', async () => {
    const { unmount } = setup();
    unmount();

    const result = templateSrv.getAdhocFilters('name');
    expect(result[0].key).toBe('origKey');
  });

  it('adds filter', async () => {
    const { variable } = setup();

    // Select key
    await userEvent.click(screen.getByTestId('AdHocFilter-add'));
    const wrapper = screen.getByTestId('AdHocFilter-');

    const selects = getAllByRole(wrapper, 'combobox');

    await waitFor(() => select(selects[0], 'key3', { container: document.body }));
    await waitFor(() => select(selects[2], 'val3', { container: document.body }));

    expect(variable.state.filters.length).toBe(3);
  });

  it('removes filter', async () => {
    const { variable } = setup();

    await userEvent.click(screen.getByTestId('AdHocFilter-remove-key1'));

    expect(variable.state.filters.length).toBe(1);
  });

  it('changes filter', async () => {
    const { variable } = setup();

    const wrapper = screen.getByTestId('AdHocFilter-key1');
    const selects = getAllByRole(wrapper, 'combobox');

    await waitFor(() => select(selects[2], 'val4', { container: document.body }));

    expect(variable.state.filters[0].value).toBe('val4');
  });
});

function setup() {
  setDataSourceSrv({
    get() {
      return {
        getTagKeys() {
          return [{ text: 'key3' }];
        },
        getTagValues() {
          return [{ text: 'val3' }, { text: 'val4' }];
        },
      };
    },
  } as unknown as DataSourceSrv);

  setTemplateSrv(templateSrv);

  const variable = new AdHocFiltersVariable({
    filters: [
      {
        key: 'key1',
        operator: '=',
        value: 'val1',
        condition: '',
      },
      {
        key: 'key2',
        operator: '=',
        value: 'val2',
        condition: '',
      },
    ],
  });

  const scene = new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [variable],
    }),
    controls: [new VariableValueSelectors({})],
    body: new SceneFlexLayout({
      children: [],
    }),
  });

  const { unmount } = render(<scene.Component model={scene} />);

  return { scene, variable, unmount };
}
