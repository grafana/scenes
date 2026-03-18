import React from 'react';
import { render, screen } from '@testing-library/react';
import { SceneContextObject } from '../contexts/SceneContextObject';
import { TestContextProvider } from '../utils/testUtils';
import { VariableControl } from '../components/VariableControl';
import { CustomVariable } from './CustomVariable';
import { CustomVariable as CustomVariableObject } from '@grafana/scenes';

describe('CustomVariable', () => {
  it('Should add itself to scene', async () => {
    const scene = new SceneContextObject();

    render(
      <TestContextProvider value={scene}>
        <CustomVariable name="customVar" query="A, B, C" initialValue="A">
          <VariableControl name="customVar" />
        </CustomVariable>
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
        <CustomVariable name="customVar" query="A, B, C" initialValue="A" label="test1">
          <VariableControl name="customVar" />
        </CustomVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('customVar') as CustomVariableObject;

    expect(variable).toBeDefined();
    expect(variable.state.label).toBe('test1');
    expect(screen.getByText('test1')).toBeInTheDocument();

    rerender(
      <TestContextProvider value={scene}>
        <CustomVariable name="customVar" query="A, B, C" initialValue="A" label="test2">
          <VariableControl name="customVar" />
        </CustomVariable>
      </TestContextProvider>
    );

    expect(variable).toBeDefined();
    expect(variable.state.label).toBe('test2');
    expect(screen.getByText('test2')).toBeInTheDocument();
  });
});
