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
  let mock: jest.SpyInstance;

  beforeEach(() => {
    mock = jest.spyOn(QueryVariableClass.prototype, 'getValueOptions').mockImplementation(() => of([]));
  });

  it('Should add itself to scene', async () => {
    const scene = new SceneContextObject();

    render(
      <TestContextProvider value={scene}>
        <QueryVariable name="customVar" query={{ query: '*', refId: 'A' }} datasource={{ uid: 'gdev-testdata' }}  initialValue="A">
          <VariableControl name="customVar" />
        </QueryVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('customVar');

    expect(variable).toBeDefined();
    expect(screen.getByText('customVar')).toBeInTheDocument();
  });

  it('Should update variable state', async () => {
    const scene = new SceneContextObject();

    const { rerender } = render(
      <TestContextProvider value={scene}>
        <QueryVariable name="customVar" query={{ query: '*', refId: 'A' }} datasource={{ uid: 'gdev-testdata' }} initialValue="A" label="test1">
          <VariableControl name="customVar" />
        </QueryVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('customVar') as QueryVariableObject;

    expect(variable).toBeDefined();
    expect(variable.state.label).toBe('test1');
    expect(screen.getByText('test1')).toBeInTheDocument();

    rerender(
      <TestContextProvider value={scene}>
        <QueryVariable name="customVar" query={{ query: '*', refId: 'A' }} datasource={{ uid: 'gdev-testdata' }}initialValue="A" label="test2">
          <VariableControl name="customVar" />
        </QueryVariable>
      </TestContextProvider>
    );

    expect(variable).toBeDefined();
    expect(variable.state.label).toBe('test2');
    expect(screen.getByText('test2')).toBeInTheDocument();
  })
});
