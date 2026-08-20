import { MultiOrSingleValueSelect } from './VariableValueSelect';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { TestScene } from '../TestScene';
import { selectors } from '@grafana/e2e-selectors';
import { CustomVariable } from '../variants/CustomVariable';
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

  describe('All value exclusivity', () => {
    function setupWithAll(value: string[], text: string[]) {
      const model = new CustomVariable({
        name: 'test',
        query: 'A,B,C',
        isMulti: true,
        includeAll: true,
        value,
        text,
        options: [
          { value: 'A', label: 'Option A' },
          { value: 'B', label: 'Option B' },
          { value: 'C', label: 'Option C' },
        ],
        key: 'test-key',
      }) as unknown as MultiValueVariable<MultiValueVariableState>;

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [model] }),
      });

      scene.activate();
      render(<MultiOrSingleValueSelect model={model} />);

      return model;
    }

    async function openMenu(model: MultiValueVariable<MultiValueVariableState>) {
      const container = screen.getByTestId(
        selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts(`${model.state.value}`)
      );
      const inputElement = container.querySelector('input')!;
      await userEvent.click(inputElement);
    }

    function optionCheckbox(label: string) {
      const option = screen.getAllByRole('option').find((o) => o.textContent === label);
      expect(option).toBeDefined();
      return within(option!).getByRole('checkbox');
    }

    it('deselects the other values when the All option is selected', async () => {
      const model = setupWithAll(['A', 'B'], ['A', 'B']);
      await openMenu(model);

      await userEvent.click(screen.getAllByRole('option').find((o) => o.textContent === 'All')!);

      // the open dropdown reflects the exclusive selection, not a mixed one
      expect(optionCheckbox('All')).toBeChecked();
      expect(optionCheckbox('A')).not.toBeChecked();
      expect(optionCheckbox('B')).not.toBeChecked();

      await userEvent.tab();
      expect(model.state.value).toEqual(['$__all']);
    });

    it('deselects the All option when another value is selected', async () => {
      const model = setupWithAll(['$__all'], ['All']);
      await openMenu(model);

      await userEvent.click(screen.getAllByRole('option').find((o) => o.textContent === 'C')!);

      expect(optionCheckbox('All')).not.toBeChecked();
      expect(optionCheckbox('C')).toBeChecked();

      await userEvent.tab();
      expect(model.state.value).toEqual(['C']);
    });

    // The toggle-all header calls onChange with a synthetic action ({ option: {} }),
    // exercising enforceAllExclusivity's fallback path rather than the option branch
    it('toggle-all header explodes All into the concrete values and collapses back', async () => {
      const model = setupWithAll(['$__all'], ['All']);
      await openMenu(model);

      // From only-All selected the header selects every concrete value
      await userEvent.click(screen.getByTestId(selectors.components.Select.toggleAllOptions));
      expect(optionCheckbox('A')).toBeChecked();
      expect(optionCheckbox('B')).toBeChecked();
      expect(optionCheckbox('C')).toBeChecked();
      expect(optionCheckbox('All')).not.toBeChecked();

      // From all-selected the header collapses the selection back to All
      // (re-query: the menu re-renders after the first toggle)
      await userEvent.click(screen.getByTestId(selectors.components.Select.toggleAllOptions));
      expect(optionCheckbox('All')).toBeChecked();
      expect(optionCheckbox('A')).not.toBeChecked();

      await userEvent.tab();
      expect(model.state.value).toEqual(['$__all']);
    });
  });
});
