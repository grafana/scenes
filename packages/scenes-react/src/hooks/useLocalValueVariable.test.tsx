import { renderHook } from '@testing-library/react';
import { getHookContextWrapper } from '../utils/testUtils';
import { useLocalValueVariable } from './useLocalValueVariable';

describe('useLocalValueVariable', () => {
  it('Should create and return LocalValueVariable', async () => {
    const { wrapper } = getHookContextWrapper({});

    const { result } = renderHook(useLocalValueVariable, {
      wrapper,
      initialProps: {
        name: 'local',
        value: 'A',
        text: 'A',
      },
    });

    expect(result.current?.state.name).toBe('local');
    expect(result.current?.state.value).toBe('A');
  });

  it('Should find, update and return LocalValueVariable', async () => {
    const { wrapper, context } = getHookContextWrapper({});

    const hook = renderHook(useLocalValueVariable, {
      wrapper,
      initialProps: {
        name: 'local',
        value: 'A',
        text: 'A',
      },
    });

    const variable = hook.result.current;
    expect(variable).toBeDefined();

    hook.rerender({ name: 'local', value: 'B', text: 'B' });

    expect(hook.result.current).toBe(variable);
    expect(context.findVariable('local')).toBe(variable);
    expect(variable?.state.value).toBe('B');
  });
});
