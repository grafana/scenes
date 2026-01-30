import React from 'react';
import { render, screen } from '@testing-library/react';
import { LocalValueVariable as LocalValueVariableObject } from '@grafana/scenes';

import { SceneContextObject } from '../contexts/SceneContextObject';
import { TestContextProvider } from '../utils/testUtils';
import { LocalValueVariable } from './LocalValueVariable';

describe('LocalValueVariable', () => {
  it('Should add itself to scene', async () => {
    const scene = new SceneContextObject();

    render(
      <TestContextProvider value={scene}>
        <LocalValueVariable name="localVar" value="A" text="A">
          <div>child</div>
        </LocalValueVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('localVar');

    expect(variable).toBeDefined();
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('Should update variable state', async () => {
    const scene = new SceneContextObject();

    const { rerender } = render(
      <TestContextProvider value={scene}>
        <LocalValueVariable name="localVar" label="test1" value="A" text="A">
          <div>child</div>
        </LocalValueVariable>
      </TestContextProvider>
    );

    const variable = scene.findVariable('localVar') as LocalValueVariableObject;

    expect(variable).toBeDefined();
    expect(variable.state.label).toBe('test1');
    expect(variable.state.value).toBe('A');

    rerender(
      <TestContextProvider value={scene}>
        <LocalValueVariable name="localVar" label="test2" value="B" text="B">
          <div>child</div>
        </LocalValueVariable>
      </TestContextProvider>
    );

    expect(variable.state.label).toBe('test2');
    expect(variable.state.value).toBe('B');
  });
});
