import React from 'react';
import { render, screen } from '@testing-library/react';
import { SceneContextObject } from '../contexts/SceneContextObject';
import { TestContextProvider } from '../utils/testUtils';
import { VariableControl } from '../components/VariableControl';
import { QueryVariable } from './QueryVariable';
import { QueryVariable as QueryVariableObject } from '@grafana/scenes';
import { of } from 'rxjs';

const QueryVariableClass = jest.requireActual('@grafana/scenes').QueryVariable;

describe('QueryVariable', () => {
  beforeEach(() => {
    jest.spyOn(QueryVariableClass.prototype, 'getValueOptions').mockImplementation(() => of([]));
  });

  it('Should add itself to scene', async () => {
    const scene = new SceneContextObject();

    render(
      <TestContextProvider value={scene}>
        <QueryVariable
          name="queryVar"
          query={{ query: '*', refId: 'A' }}
          datasource={{ uid: 'gdev-testdata' }}
          initialValue="A"
        >
          <VariableControl name="queryVar" />
        </QueryVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('queryVar');

    expect(variable).toBeDefined();
    expect(screen.getByText('queryVar')).toBeInTheDocument();
  });

  it('Should update variable state', async () => {
    const scene = new SceneContextObject();

    const { rerender } = render(
      <TestContextProvider value={scene}>
        <QueryVariable
          name="queryVar"
          query={{ query: '*', refId: 'A' }}
          datasource={{ uid: 'gdev-testdata' }}
          initialValue="A"
          label="test1"
        >
          <VariableControl name="queryVar" />
        </QueryVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('queryVar') as QueryVariableObject;

    expect(variable).toBeDefined();
    expect(variable.state.label).toBe('test1');
    expect(screen.getByText('test1')).toBeInTheDocument();

    rerender(
      <TestContextProvider value={scene}>
        <QueryVariable
          name="queryVar"
          query={{ query: '*', refId: 'A' }}
          datasource={{ uid: 'gdev-testdata' }}
          initialValue="A"
          label="test2"
        >
          <VariableControl name="queryVar" />
        </QueryVariable>
      </TestContextProvider>
    );

    expect(variable).toBeDefined();
    expect(variable.state.label).toBe('test2');
    expect(screen.getByText('test2')).toBeInTheDocument();
  });
});
