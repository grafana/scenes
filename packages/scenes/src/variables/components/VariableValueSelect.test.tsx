import { getVariableSelectedCount, MultiOrSingleValueSelect } from './VariableValueSelect';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { TestScene } from '../TestScene';
import { selectors } from '@grafana/e2e-selectors';
import { CustomVariable } from '../variants/CustomVariable';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { MultiValueVariable, MultiValueVariableState } from '../variants/MultiValueVariable';
import userEvent from '@testing-library/user-event';

jest.mock('@grafana/i18n', () => {
  const translations: Record<string, string> = {};
  return {
    ...jest.requireActual('@grafana/i18n'),
    t: (id: string, defaultMessage: string) => translations[id] ?? defaultMessage,
    mockTranslations: translations,
  };
});

// @grafana/ui calls t() while it is being imported, before a top-level const in this file is initialised,
// so the mock owns the translation map and the tests reach it through the mocked module.
const { mockTranslations: translations } = jest.requireMock<{ mockTranslations: Record<string, string> }>(
  '@grafana/i18n'
);

const ALL_LABEL_KEY = 'grafana-scenes.variables.variable-value-select.all-label';

describe('VariableValueSelect', () => {
  let model: MultiValueVariable<MultiValueVariableState>;

  beforeEach(() => {
    model = new CustomVariable({
      name: 'test',
      query: 'A,B,C',
      isMulti: true,
      allowCustomValue: true,
      // Non-empty initial value — [] is treated as an intentional empty selection
      value: ['A'],
      text: ['Option A'],
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
      value: ['A'],
      text: ['Option A'],
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
      value: ['A'],
      text: ['Option A'],
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
    const { model } = setupMultiVariable({ value: [ALL_VARIABLE_VALUE], text: [ALL_VARIABLE_TEXT] });

    for (const _attempt of [1, 2]) {
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(screen.getByRole('button', { name: 'Clear value' }));
      await userEvent.click(screen.getByTestId('outside'));

      expect(model.state.value).toEqual([ALL_VARIABLE_VALUE]);
      expect(screen.getByText(ALL_VARIABLE_TEXT)).toBeInTheDocument();
    }
  });

  it('should commit the clear even when the picker was never focused', async () => {
    const { model } = setupMultiVariable({ value: ['A', 'B'], text: ['A', 'B'] });

    await userEvent.click(screen.getByRole('button', { name: 'Clear value' }));

    expect(model.state.value).toEqual([ALL_VARIABLE_VALUE]);
    expect(screen.getByText(ALL_VARIABLE_TEXT)).toBeInTheDocument();
  });

  it('should fall back to the first option when the selection is cleared and defaultToAll is false', async () => {
    const { model } = setupMultiVariable({ defaultToAll: false, value: ['B'], text: ['B'] });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('button', { name: 'Clear value' }));
    await userEvent.click(screen.getByTestId('outside'));

    expect(model.state.value).toEqual(['A']);
  });

  it('should commit the selection made while the menu was open', async () => {
    const { model } = setupMultiVariable({ value: ['A'], text: ['A'], defaultToAll: false });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('B'));
    await userEvent.click(screen.getByTestId('outside'));

    expect(model.state.value).toEqual(['A', 'B']);
    expect(
      screen.getByTestId(selectors.pages.Dashboard.SubMenu.submenuItemValueDropDownValueLinkTexts('A,B'))
    ).toBeInTheDocument();
  });

  it('counts every individual option when `$__all` is selected', () => {
    const options = [
      { value: ALL_VARIABLE_VALUE, label: 'All' },
      { value: 'A', label: 'A' },
      { value: 'B', label: 'B' },
      { value: 'C', label: 'C' },
    ];

    expect(getVariableSelectedCount([{ value: ALL_VARIABLE_VALUE }], options)).toBe(3);
    expect(getVariableSelectedCount([{ value: 'A' }, { value: 'B' }], options)).toBe(2);
    expect(getVariableSelectedCount([], options)).toBe(0);
  });

  it('checking All selects every value', async () => {
    const { model } = setupMultiVariable({
      value: ['A'],
      text: ['A'],
      defaultToAll: false,
    });

    await userEvent.click(screen.getByRole('combobox'));
    const allLabels = screen.getAllByText(ALL_VARIABLE_TEXT);
    await userEvent.click(allLabels[allLabels.length - 1]);

    // All + every individual checkbox should be checked
    const checked = screen.getAllByRole('checkbox').filter((el) => (el as HTMLInputElement).checked);
    expect(checked.length).toBeGreaterThanOrEqual(4); // Selected header + All + A,B,C (header may also be checked)

    await userEvent.click(screen.getByTestId('outside'));
    expect(model.state.value).toEqual([ALL_VARIABLE_VALUE]);
  });

  it('unchecking All clears every value', async () => {
    const { model } = setupMultiVariable({
      value: [ALL_VARIABLE_VALUE],
      text: [ALL_VARIABLE_TEXT],
      defaultToAll: true,
    });

    await userEvent.click(screen.getByRole('combobox'));
    const allLabels = screen.getAllByText(ALL_VARIABLE_TEXT);
    await userEvent.click(allLabels[allLabels.length - 1]);

    const checked = screen.getAllByRole('checkbox').filter((el) => (el as HTMLInputElement).checked);
    expect(checked).toHaveLength(0);

    await userEvent.click(screen.getByTestId('outside'));
    // Unchecking All commits [] via changeValueTo(..., { allowEmpty: true })
    expect(model.state.value).toEqual([]);
    expect(model.state.text).toEqual([]);
  });

  it('should exit All and keep remaining values when one value is unchecked while `$__all` is active', async () => {
    const { model } = setupMultiVariable({ value: [ALL_VARIABLE_VALUE], text: [ALL_VARIABLE_TEXT] });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('B'));
    await userEvent.click(screen.getByTestId('outside'));

    expect(model.state.value).toEqual(['A', 'C']);
  });

  it('should collapse to `$__all` when every individual value becomes selected', async () => {
    const { model } = setupMultiVariable({
      value: ['A', 'B'],
      text: ['A', 'B'],
      defaultToAll: false,
    });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('C'));
    await userEvent.click(screen.getByTestId('outside'));

    expect(model.state.value).toEqual([ALL_VARIABLE_VALUE]);
  });

  it('should keep an explicit full selection when Include All is disabled', async () => {
    const { model } = setupMultiVariable({
      includeAll: false,
      defaultToAll: false,
      value: ['A', 'B'],
      text: ['A', 'B'],
    });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('C'));
    await userEvent.click(screen.getByTestId('outside'));

    expect(model.state.value).toEqual(['A', 'B', 'C']);
  });
});

describe('All option localization', () => {
  beforeEach(() => {
    translations[ALL_LABEL_KEY] = 'Tout';
  });

  afterEach(() => {
    delete translations[ALL_LABEL_KEY];
  });

  function setupVariable(state: Partial<MultiValueVariableState>) {
    const model = new CustomVariable({
      name: 'test',
      query: 'A,B,C',
      includeAll: true,
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

    render(<MultiOrSingleValueSelect model={model} />);

    return { model };
  }

  it('should show the translated All label as the selected single value', async () => {
    setupVariable({ isMulti: false, value: ALL_VARIABLE_VALUE, text: ALL_VARIABLE_TEXT });

    expect(screen.getByText('Tout')).toBeInTheDocument();
    expect(screen.queryByText(ALL_VARIABLE_TEXT)).not.toBeInTheDocument();
  });

  it('should show the translated All label as a selected multi value', async () => {
    setupVariable({ isMulti: true, value: [ALL_VARIABLE_VALUE], text: [ALL_VARIABLE_TEXT] });

    expect(screen.getByText('Tout')).toBeInTheDocument();
    expect(screen.queryByText(ALL_VARIABLE_TEXT)).not.toBeInTheDocument();
  });

  it('should keep the untranslated text in variable state when selecting All', async () => {
    const { model } = setupVariable({ isMulti: false, value: 'A', text: 'A' });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('Tout'));

    expect(model.state.value).toBe(ALL_VARIABLE_VALUE);
    // ${var:text} and the legacy `All` URL value depend on this staying untranslated
    expect(model.state.text).toBe(ALL_VARIABLE_TEXT);
    expect(model.getValueText()).toBe(ALL_VARIABLE_TEXT);
  });
});
