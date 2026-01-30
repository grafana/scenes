import { renderHook } from '@testing-library/react';
import { getHookContextWrapper } from '../utils/testUtils';
import { useAdHocFiltersVariable } from './useAdHocFiltersVariable';

describe('useAdHocFiltersVariable', () => {
  it('Should create and return AdHocFiltersVariable', async () => {
    const { wrapper } = getHookContextWrapper({});

    const { result } = renderHook(useAdHocFiltersVariable, {
      wrapper,
      initialProps: {
        name: 'Filters',
        datasource: null,
        filters: [],
      },
    });

    expect(result.current?.state.name).toBe('Filters');
    expect(result.current?.state.datasource).toBeNull();
    expect(result.current?.state.filters).toEqual([]);
  });

  it('Should find, update and return AdHocFiltersVariable', async () => {
    const { wrapper, context } = getHookContextWrapper({});

    // First render creates it
    const first = renderHook(useAdHocFiltersVariable, {
      wrapper,
      initialProps: {
        name: 'Filters',
        datasource: null,
        filters: [],
        readOnly: true,
      },
    });

    const variable = first.result.current;
    expect(variable).toBeDefined();
    expect(variable?.state.readOnly).toBe(true);

    // Rerender updates it
    first.rerender({
      name: 'Filters',
      datasource: null,
      filters: [{ key: 'job', operator: '=', value: 'grafana', condition: '' }],
      readOnly: false,
    });

    expect(first.result.current).toBe(variable);
    expect(context.findVariable('Filters')).toBe(variable);
    expect(variable?.state.readOnly).toBe(false);
    expect(variable?.state.filters).toEqual([{ key: 'job', operator: '=', value: 'grafana', condition: '' }]);
  });
});

