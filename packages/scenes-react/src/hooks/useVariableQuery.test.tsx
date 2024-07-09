import { renderHook, waitFor } from '@testing-library/react';
import { TestVariable } from '@grafana/scenes';
import { getHookContextWrapper } from '../utils/testUtils';
import { useVariableQuery } from './useVariableQuery';

describe('useVariableQuery', () => {
  it('Should return value options', async () => {
    const variable = new TestVariable({ name: 'env' });

    const { wrapper } = getHookContextWrapper({
      variables: [variable],
    });

    renderHook((useVariableQuery), {
      wrapper,
      initialProps: 'env',
    });

    await waitFor(() => {
      //1 call for initial context, 1 for the hook
      expect(variable.getValueOptionsCount).toBe(2);
    })
  });
});
