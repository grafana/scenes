import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdHocFiltersVariable as AdHocFiltersVariableObject } from '@grafana/scenes';

import { SceneContextObject } from '../contexts/SceneContextObject';
import { TestContextProvider } from '../utils/testUtils';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';

describe('AdHocFiltersVariable', () => {
  it('Should add itself to scene', async () => {
    const scene = new SceneContextObject();

    render(
      <TestContextProvider value={scene}>
        <AdHocFiltersVariable name="Filters" datasource={null} filters={[]}>
          <div>child</div>
        </AdHocFiltersVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('Filters');

    expect(variable).toBeDefined();
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('Should update variable state', async () => {
    const scene = new SceneContextObject();

    const { rerender } = render(
      <TestContextProvider value={scene}>
        <AdHocFiltersVariable
          name="Filters"
          label="test1"
          datasource={null}
          filters={[{ key: '', operator: '=', value: '', condition: '' }]}
          readOnly={true}
          applyMode="manual"
        >
          <div>child</div>
        </AdHocFiltersVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('Filters') as AdHocFiltersVariableObject;

    expect(variable).toBeDefined();
    expect(variable.state.label).toBe('test1');
    expect(variable.state.readOnly).toBe(true);
    expect(variable.state.filters).toEqual([{ key: '', operator: '=', value: '', condition: '' }]);

    rerender(
      <TestContextProvider value={scene}>
        <AdHocFiltersVariable
          name="Filters"
          label="test2"
          datasource={null}
          filters={[{ key: 'job', operator: '=', value: 'grafana', condition: '' }]}
          readOnly={false}
          applyMode="manual"
        >
          <div>child</div>
        </AdHocFiltersVariable>
      </TestContextProvider>
    );

    expect(variable.state.label).toBe('test2');
    expect(variable.state.readOnly).toBe(false);
    expect(variable.state.filters).toEqual([{ key: 'job', operator: '=', value: 'grafana', condition: '' }]);
  });
});
