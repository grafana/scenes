import { MultiOrSingleValueSelect } from './VariableValueSelect';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { TestScene } from '../TestScene';
import { selectors } from '@grafana/e2e-selectors';
import { CustomVariable } from '../variants/CustomVariable';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { MultiValueVariable, MultiValueVariableState } from '../variants/MultiValueVariable';
import userEvent from '@testing-library/user-event';

describe('VariableValueSelect', () => {
  let model: MultiValueVariable<MultiValueVariableState>;

  beforeEach(() => {
    model = new CustomVariable({
      name: 'test',
      query: 'A,B,C',
      isMulti: true,
      allowCustomValue: true,
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
  });

  it('should render VariableValueSelect component', async () => {
    render(<MultiOrSingleValueSelect model={model} />);
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
      value: [],
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

    render(<MultiOrSingleValueSelect model={model} />);
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
      value: [],
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

    render(<MultiOrSingleValueSelect model={model} />);
    const variableValueSelectElement = screen.getByTestId(
      selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${model.state.value}`)
    );
    //expect input children inside the variableValueSelectElement to be disabled
    const inputElement = variableValueSelectElement.querySelector('input');
    expect(variableValueSelectElement).toBeInTheDocument();
    expect(inputElement).toBeDisabled();
  });

  it('should render options in VariableValueSelect component', async () => {
    render(<MultiOrSingleValueSelect model={model} />);
    const variableValueSelectElement = screen.getByTestId(
      selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${model.state.value}`)
    );
    //open dropwdown
    const inputElement = variableValueSelectElement.querySelector('input');
    expect(inputElement).toBeInTheDocument();
    if (!inputElement) {
      return;
    }
    await userEvent.click(inputElement);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
  });

  it('should render custom values in VariableValueSelect component', async () => {
    render(<MultiOrSingleValueSelect model={model} />);
    const variableValueSelectElement = screen.getByTestId(
      selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${model.state.value}`)
    );
    const inputElement = variableValueSelectElement.querySelector('input');
    expect(inputElement).toBeInTheDocument();
    if (!inputElement) {
      return;
    }

    //type custom value in input
    await userEvent.type(inputElement, 'custom value');
    let options = screen.getAllByRole('option');
    //expect custom value to be the only value added to options
    expect(options).toHaveLength(1);
  });

  it('should not render custom values when allowCustomValue is false in VariableValueSelect component', async () => {
    model.setState({ allowCustomValue: false });

    render(<MultiOrSingleValueSelect model={model} />);
    const variableValueSelectElement = screen.getByTestId(
      selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${model.state.value}`)
    );
    const inputElement = variableValueSelectElement.querySelector('input');
    expect(inputElement).toBeInTheDocument();
    if (!inputElement) {
      return;
    }

    //expect no options now since we are typing a value that isn't in the list of options and also we can't add custom values
    await userEvent.type(inputElement, 'custom value');
    const options = screen.queryAllByRole('option');
    expect(options).toHaveLength(0);
  });
});

describe('VariableValueSelectMulti', () => {
  function setupMultiVariable(state: Partial<MultiValueVariableState>) {
    const model = new CustomVariable({
      name: 'test',
      query: 'A,B,C',
      isMulti: true,
      includeAll: true,
      defaultToAll: true,
      key: 'test-key',
      options: [
        { value: 'A', label: 'A' },
        { value: 'B', label: 'B' },
        { value: 'C', label: 'C' },
      ],
      ...state,
    } as MultiValueVariableState) as unknown as MultiValueVariable<MultiValueVariableState>;

    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [model],
      }),
    });

    scene.activate();

    const result = render(
      <div>
        <MultiOrSingleValueSelect model={model} />
        <button data-testid="outside">outside</button>
      </div>
    );

    return { model, ...result };
  }

  function getRemoveButtonFor(label: string) {
    return within(screen.getByText(label).parentElement!).getByRole('button', { name: 'Remove' });
  }

  it('should only fall back to the All value once the last selected option is removed', async () => {
    const { model } = setupMultiVariable({ value: ['A', 'B'], text: ['A', 'B'] });

    await userEvent.click(getRemoveButtonFor('A'));
    await userEvent.click(screen.getByTestId('outside'));

    expect(model.state.value).toEqual(['B']);

    await userEvent.click(getRemoveButtonFor('B'));
    await userEvent.click(screen.getByTestId('outside'));

    expect(model.state.value).toEqual([ALL_VARIABLE_VALUE]);
    expect(screen.getByText(ALL_VARIABLE_TEXT)).toBeInTheDocument();
  });

  it('should fall back to the All value every time the selection is cleared', async () => {
    const { model, container } = setupMultiVariable({ value: [ALL_VARIABLE_VALUE], text: [ALL_VARIABLE_TEXT] });

    for (const _attempt of [1, 2]) {
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(container.querySelector('[aria-label="select-clear-value"]')!);
      await userEvent.click(screen.getByTestId('outside'));

      expect(model.state.value).toEqual([ALL_VARIABLE_VALUE]);
      expect(screen.getByText(ALL_VARIABLE_TEXT)).toBeInTheDocument();
    }
  });

  it('should fall back to the first option when the selection is cleared and defaultToAll is false', async () => {
    const { model, container } = setupMultiVariable({ defaultToAll: false, value: ['B'], text: ['B'] });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(container.querySelector('[aria-label="select-clear-value"]')!);
    await userEvent.click(screen.getByTestId('outside'));

    expect(model.state.value).toEqual(['A']);
  });

  it('should commit the selection made while the menu was open', async () => {
    const { model } = setupMultiVariable({ value: [ALL_VARIABLE_VALUE], text: [ALL_VARIABLE_TEXT] });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('B'));
    await userEvent.click(screen.getByTestId('outside'));

    expect(model.state.value).toEqual(['B']);
  });
});
