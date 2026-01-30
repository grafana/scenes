import React from 'react';
import { render, screen } from '@testing-library/react';
import { GroupByVariable as GroupByVariableObject } from '@grafana/scenes';
import { of } from 'rxjs';

import { SceneContextObject } from '../contexts/SceneContextObject';
import { TestContextProvider } from '../utils/testUtils';
import { GroupByVariable } from './GroupByVariable';

const GroupByVariableClass = jest.requireActual('@grafana/scenes').GroupByVariable;

describe('GroupByVariable', () => {
  beforeEach(() => {
    jest.spyOn(GroupByVariableClass.prototype, 'getValueOptions').mockImplementation(() => of([]));
    jest.spyOn(GroupByVariableClass.prototype, '_verifyApplicability').mockResolvedValue(undefined);
  });

  it('Should add itself to scene', async () => {
    const scene = new SceneContextObject();

    render(
      <TestContextProvider value={scene}>
        <GroupByVariable name="groupBy" datasource={null}>
          <div>child</div>
        </GroupByVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('groupBy');

    expect(variable).toBeDefined();
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('Should update variable state', async () => {
    const scene = new SceneContextObject();

    const { rerender } = render(
      <TestContextProvider value={scene}>
        <GroupByVariable name="groupBy" label="test1" datasource={null} readOnly={true}>
          <div>child</div>
        </GroupByVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('groupBy') as GroupByVariableObject;

    expect(variable).toBeDefined();
    expect(variable.state.label).toBe('test1');
    expect(variable.state.readOnly).toBe(true);

    rerender(
      <TestContextProvider value={scene}>
        <GroupByVariable name="groupBy" label="test2" datasource={null} readOnly={false}>
          <div>child</div>
        </GroupByVariable>
      </TestContextProvider>
    );

    expect(variable.state.label).toBe('test2');
    expect(variable.state.readOnly).toBe(false);
  });
});
