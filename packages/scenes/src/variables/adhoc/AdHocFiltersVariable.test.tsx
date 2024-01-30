import React from 'react';
import { render } from '@testing-library/react';
import { SceneVariableValueChangedEvent } from '../types';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';

describe('AdHocFiltersVariable', () => {
  it('By default renders a prometheus / loki compatible label filter', () => {
    const variable = AdHocFiltersVariable.create({
      datasource: { uid: 'hello' },
      filters: [
        {
          key: 'key1',
          operator: '=',
          value: 'val1',
          condition: '',
        },
        {
          key: 'key2',
          operator: '=~',
          value: '[val2]',
          condition: '',
        },
      ],
    });

    variable.activate();

    expect(variable.getValue()).toBe(`key1="val1",key2=~"\\\\[val2\\\\]"`);
  });

  it('Should not publish event on activation', () => {
    const variable = AdHocFiltersVariable.create({
      datasource: { uid: 'hello' },
      filters: [
        {
          key: 'key1',
          operator: '=',
          value: 'val1',
          condition: '',
        },
      ],
    });

    const evtHandler = jest.fn();
    variable.subscribeToEvent(SceneVariableValueChangedEvent, evtHandler);
    variable.activate();

    expect(evtHandler).not.toHaveBeenCalled();
  });

  it('Should not publish event on when expr did not change', () => {
    const variable = AdHocFiltersVariable.create({
      datasource: { uid: 'hello' },
      filters: [
        {
          key: 'key1',
          operator: '=',
          value: 'val1',
          condition: '',
        },
      ],
    });

    variable.activate();

    const evtHandler = jest.fn();
    variable.subscribeToEvent(SceneVariableValueChangedEvent, evtHandler);

    variable.state.set.setState({ filters: variable.state.set.state.filters.slice(0) });

    expect(evtHandler).not.toHaveBeenCalled();
  });

  describe('Component', () => {
    it('should use the model.state.set.Component to ensure the state filterset is activated', () => {
      const variable = AdHocFiltersVariable.create({
        datasource: { uid: 'hello' },
        filters: [
          {
            key: 'key1',
            operator: '=',
            value: 'val1',
            condition: '',
          },
        ],
      });

      render(<variable.Component model={variable} />);

      expect(variable.state.set.isActive).toBe(true);
    });
  });
});
