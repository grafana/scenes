import { act, renderHook } from '@testing-library/react';
import { TestVariable } from '@grafana/scenes';
import { useVariableValue } from './useVariableValue';
import { getHookContextWrapper } from '../utils/testUtils';

describe('useVariableValue', () => {
  it('Should return single value', async () => {
    const variable = new TestVariable({
      name: 'env',
      options: [],
      isMulti: false,
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

    const { result } = renderHook(useVariableValue, {
      wrapper,
      initialProps: 'env',
    });

    const [values, loading] = result.current;

    expect(values).toEqual('A');
    expect(loading).toEqual(false);

    act(() => variable.setState({ value: 'B' }));

    const [values2] = result.current;
    expect(values2).toEqual('B');
  });

  it('Should return undefined if multivalue', async () => {
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

    const { result } = renderHook(useVariableValue, {
      wrapper,
      initialProps: 'env',
    });

    const [values, loading] = result.current;

    expect(values).toEqual(undefined);
    expect(loading).toEqual(false);
  });
});
