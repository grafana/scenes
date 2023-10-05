import React from 'react';

import { render, screen } from '@testing-library/react';

import { TextBoxVariable } from './TextBoxVariable';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { EmbeddedScene } from '../../components/EmbeddedScene';
import { VariableValueSelectors } from '../components/VariableValueSelectors';
import { TestObjectWithVariableDependency } from '../TestScene';

describe('TextBoxVariable', () => {
  it('Should not cause variable change mounted', async () => {
    const nestedObj = new TestObjectWithVariableDependency({ title: '$search', variableValueChanged: 0 });

    const scene = new EmbeddedScene({
      $variables: new SceneVariableSet({ variables: [new TextBoxVariable({ name: 'search' })] }),
      controls: [new VariableValueSelectors({})],
      body: nestedObj,
    });

    render(<scene.Component model={scene} />);

    // There was a debounce before that fired some time after mount
    await new Promise((r) => setTimeout(r, 300));

    expect(screen.getByText('search')).toBeInTheDocument();
    expect(nestedObj.state.variableValueChanged).toBe(0);
  });
});
