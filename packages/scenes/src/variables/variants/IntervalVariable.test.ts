import { VariableRefresh } from '@grafana/schema';
import { lastValueFrom } from 'rxjs';

import { AUTO_VARIABLE_VALUE, AUTO_VARIABLE_TEXT } from '../constants';
import { SceneVariableValueChangedEvent } from '../types';
import { IntervalVariable } from './IntervalVariable';

describe('IntervalVariable', () => {
  describe('When intervals are provided', () => {
    it('Should generate correctly the options', async () => {
      const variable = new IntervalVariable({
        name: 'intervalTest',
        intervals: ['1s', '1m', '1h'],
        refresh: VariableRefresh.onTimeRangeChanged,
      });

      expect(variable.getOptionsForSelect()).toEqual([
        { label: '1s', value: '1s' },
        { label: '1m', value: '1m' },
        { label: '1h', value: '1h' },
      ]);
    });

    it('Should add non existing value to intervals when provided', async () => {
      const variable = new IntervalVariable({
        name: 'intervalTest',
        intervals: ['1s', '1m', '1h'],
        refresh: VariableRefresh.onTimeRangeChanged,
        value: '1d',
      });

      expect(variable.getOptionsForSelect()).toEqual([
        { label: '1s', value: '1s' },
        { label: '1m', value: '1m' },
        { label: '1h', value: '1h' },
        { label: '1d', value: '1d' },
      ]);
    });
  });

  describe('When intervals are not provided', () => {
    it('Should generate correctly the default options', async () => {
      const variable = new IntervalVariable({
        name: 'intervalTest',
        refresh: VariableRefresh.onTimeRangeChanged,
      });

      expect(variable.getOptionsForSelect()).toEqual([
        { label: '1m', value: '1m' },
        { label: '10m', value: '10m' },
        { label: '30m', value: '30m' },
        { label: '1h', value: '1h' },
        { label: '6h', value: '6h' },
        { label: '12h', value: '12h' },
        { label: '1d', value: '1d' },
        { label: '7d', value: '7d' },
        { label: '14d', value: '14d' },
        { label: '30d', value: '30d' },
      ]);
    });
  });

  describe('When autoEnabled is true', () => {
    it('Should add the auto option to the interval options', async () => {
      const variable = new IntervalVariable({
        name: 'intervalTest',
        intervals: ['1s', '1m', '1h'],
        autoEnabled: true,
        refresh: VariableRefresh.onTimeRangeChanged,
      });

      expect(variable.getOptionsForSelect()).toEqual([
        { label: AUTO_VARIABLE_TEXT, value: AUTO_VARIABLE_VALUE },
        { label: '1s', value: '1s' },
        { label: '1m', value: '1m' },
        { label: '1h', value: '1h' },
      ]);
    });
  });

  describe('When autoEnabled is false', () => {
    it('Should not add the auto option to the interval options', async () => {
      const variable = new IntervalVariable({
        name: 'intervalTest',
        intervals: ['1s', '1m', '1h'],
        autoEnabled: false,
        refresh: VariableRefresh.onTimeRangeChanged,
      });

      expect(variable.getOptionsForSelect()).toEqual([
        { label: '1s', value: '1s' },
        { label: '1m', value: '1m' },
        { label: '1h', value: '1h' },
      ]);
    });
  });

  describe('When getValue is called', () => {
    it('should call the interval calculation if auto is selected', async () => {
      const variable = new IntervalVariable({
        name: 'intervalTest',
        intervals: ['1s', '1m', '1h'],
        autoEnabled: true,
        autoMinInterval: '10s',
        autoStepCount: 30,
        refresh: VariableRefresh.onTimeRangeChanged,
        value: AUTO_VARIABLE_VALUE,
      });

      expect(variable.getValue()).toEqual('10m');
      expect(variable.state.name).toEqual('intervalTest');
    });

    it('should return the selected value if auto is not selected', async () => {
      const variable = new IntervalVariable({
        name: 'intervalTest',
        intervals: ['1s', '1m', '1h'],
        autoEnabled: true,
        value: '1m',
        refresh: VariableRefresh.onTimeRangeChanged,
      });

      expect(variable.getValue()).toEqual('1m');
    });
  });

  describe('When validateAndUpdate is called', () => {
    it('should send a change event if auto is selected', async () => {
      const variable = new IntervalVariable({
        name: 'intervalTest',
        intervals: ['1s', '1m', '1h'],
        autoEnabled: true,
        autoMinInterval: '10s',
        autoStepCount: 30,
        refresh: VariableRefresh.onTimeRangeChanged,
        value: AUTO_VARIABLE_VALUE,
      });

      let changeEvent: SceneVariableValueChangedEvent | undefined;
      variable.subscribeToEvent(SceneVariableValueChangedEvent, (evt) => (changeEvent = evt));

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe(AUTO_VARIABLE_VALUE);
      expect(changeEvent).toBeDefined();
    });
  });

  describe('Url syncing', () => {
    it('getUrlState should return value when variable is selected', () => {
      const variable = new IntervalVariable({
        name: 'intervalTest',
        intervals: ['1s', '1m', '1h'],
        autoEnabled: true,
        autoMinInterval: '10s',
        autoStepCount: 30,
        refresh: VariableRefresh.onTimeRangeChanged,
        value: '1m',
      });

      expect(variable.getUrlState()).toEqual({ 'var-intervalTest': '1m' });
    });

    it('getUrlState should return value $__auto when auto option is selected', () => {
      const variable = new IntervalVariable({
        name: 'intervalTest',
        intervals: ['1s', '1m', '1h'],
        autoEnabled: true,
        autoMinInterval: '10s',
        autoStepCount: 30,
        refresh: VariableRefresh.onTimeRangeChanged,
        value: AUTO_VARIABLE_VALUE,
      });

      expect(variable.getUrlState()).toEqual({ 'var-intervalTest': '$__auto' });
    });
    it('fromUrlState should update value for intervalText variable', async () => {
      const variable = new IntervalVariable({
        name: 'intervalTest',
        intervals: ['1s', '1m', '1h'],
        autoEnabled: true,
        autoMinInterval: '10s',
        autoStepCount: 30,
        refresh: VariableRefresh.onTimeRangeChanged,
        value: AUTO_VARIABLE_VALUE,
      });
      variable.urlSync?.updateFromUrl({ ['var-intervalTest']: '2d' });
      expect(variable.state.value).toEqual('2d');
    });
  });
});
