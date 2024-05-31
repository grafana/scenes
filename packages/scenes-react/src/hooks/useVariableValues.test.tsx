import { act, renderHook } from '@testing-library/react';
import { TestVariable } from '@grafana/scenes';
import { useVariableValues } from './useVariableValues';
import { getHookContextWrapper } from '../utils/testUtils';

describe('useVariableValues', () => {
  it('Should return values', async () => {
    const variable = new TestVariable({
      name: 'env',
      options: [],
      isMulti: true,
      optionsToReturn: [
        { label: 'A', value: 'A' },
        { label: 'C', value: 'C' },
      ],
      value: ['A', 'B', 'C'],
      text: ['A', 'B', 'C'],
      delayMs: 0,
    });

    const { wrapper } = getHookContextWrapper({
      variables: [variable],
    });

    const { result } = renderHook(useVariableValues, {
      wrapper,
      initialProps: 'env',
    });

    const [values, loading] = result.current;

    expect(values).toEqual(['A', 'C']);
    expect(loading).toEqual(false);

    act(() => variable.setState({ value: ['A'] }));

    const [values2] = result.current;
    expect(values2).toEqual(['A']);
  });
});
