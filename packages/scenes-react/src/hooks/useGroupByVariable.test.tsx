import { renderHook } from '@testing-library/react';
import { of } from 'rxjs';

import { getHookContextWrapper } from '../utils/testUtils';
import { useGroupByVariable } from './useGroupByVariable';

const GroupByVariableClass = jest.requireActual('@grafana/scenes').GroupByVariable;

describe('useGroupByVariable', () => {
  beforeEach(() => {
    jest.spyOn(GroupByVariableClass.prototype, 'getValueOptions').mockImplementation(() => of([]));
    jest.spyOn(GroupByVariableClass.prototype, '_verifyApplicability').mockResolvedValue(undefined);
  });

  it('Should create and return GroupByVariable', async () => {
    const { wrapper } = getHookContextWrapper({});

    const { result } = renderHook(useGroupByVariable, {
      wrapper,
      initialProps: {
        name: 'groupBy',
        datasource: null,
      },
    });

    expect(result.current?.state.name).toBe('groupBy');
    expect(result.current?.state.datasource).toBeNull();
  });

  it('Should find, update and return GroupByVariable', async () => {
    const { wrapper, context } = getHookContextWrapper({});

    const hook = renderHook(useGroupByVariable, {
      wrapper,
      initialProps: {
        name: 'groupBy',
        datasource: null,
        readOnly: true,
      },
    });

    const variable = hook.result.current;
    expect(variable).toBeDefined();
    expect(variable?.state.readOnly).toBe(true);

    hook.rerender({ name: 'groupBy', datasource: null, readOnly: false });

    expect(hook.result.current).toBe(variable);
    expect(context.findVariable('groupBy')).toBe(variable);
    expect(variable?.state.readOnly).toBe(false);
  });
});

