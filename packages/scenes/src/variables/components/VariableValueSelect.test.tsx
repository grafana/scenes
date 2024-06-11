import { VariableValueSelect, VariableValueSelectMulti } from './VariableValueSelect';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { TestScene } from '../TestScene';
import { selectors } from '@grafana/e2e-selectors';
import { CustomVariable } from '../variants/CustomVariable';
import { MultiValueVariable, MultiValueVariableState } from '../variants/MultiValueVariable';

describe('VariableValueSelect', () => {
  it('should render VariableValueSelect component', async () => {
    const model = new CustomVariable({
      name: 'test',
      query: 'A,B,C',
      isMulti: true,
      value: [],
      text: '',
      options: [
        { value: 'A', label: 'Option A' },
        { value: 'B', label: 'Option B' },
        { value: 'C', label: 'Option C' },
      ],
      includeAll: false,
      isReadOnly: false,
      key: 'test-key',
    }) as unknown as MultiValueVariable<MultiValueVariableState>;

    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [model],
      }),
    });

    scene.activate();

    render(<VariableValueSelect model={model} />);
    const variableValueSelectElement = screen.getByTestId(
      selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${model.state.value}`)
    );
    expect(variableValueSelectElement).toBeInTheDocument();
  });

  it('should render VariableValueSelectMulti component with disabled value', async () => {
    const model = new CustomVariable({
      name: 'test',
      query: 'A,B,C',
      isMulti: true,
      value: '',
      text: '',
      options: [
        { value: 'A', label: 'Option A' },
        { value: 'B', label: 'Option B' },
        { value: 'C', label: 'Option C' },
      ],
      includeAll: false,
      isReadOnly: true,
      key: 'test-key',
    }) as unknown as MultiValueVariable<MultiValueVariableState>;

    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [model],
      }),
    });

    scene.activate();

    render(<VariableValueSelectMulti model={model} />);
    const variableValueSelectElement = screen.getByTestId(
      selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${model.state.value}`)
    );
    //expect input children inside the variableValueSelectElement to be disabled
    const inputElement = variableValueSelectElement.querySelector('input');
    expect(variableValueSelectElement).toBeInTheDocument();
    expect(inputElement).toBeDisabled();
  });
  it('should render VariableValueSelect component with disabled value', async () => {
    const model = new CustomVariable({
      name: 'test',
      query: 'A,B,C',
      isMulti: true,
      value: '',
      text: '',
      options: [
        { value: 'A', label: 'Option A' },
        { value: 'B', label: 'Option B' },
        { value: 'C', label: 'Option C' },
      ],
      includeAll: false,
      isReadOnly: true,
      key: 'test-key',
    }) as unknown as MultiValueVariable<MultiValueVariableState>;

    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [model],
      }),
    });

    scene.activate();

    render(<VariableValueSelect model={model} />);
    const variableValueSelectElement = screen.getByTestId(
      selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${model.state.value}`)
    );
    //expect input children inside the variableValueSelectElement to be disabled
    const inputElement = variableValueSelectElement.querySelector('input');
    expect(variableValueSelectElement).toBeInTheDocument();
    expect(inputElement).toBeDisabled();
  });
});
