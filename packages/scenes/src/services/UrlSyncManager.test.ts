import { Location } from 'history';

import { locationService } from '@grafana/runtime';

import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneObjectState, SceneObject, SceneObjectUrlValues } from '../core/types';

import { SceneObjectUrlSyncConfig } from './SceneObjectUrlSyncConfig';
import { isUrlValueEqual, UrlSyncManager } from './UrlSyncManager';

interface TestObjectState extends SceneObjectState {
  name: string;
  optional?: string;
  array?: string[];
  other?: string;
}

class TestObj extends SceneObjectBase<TestObjectState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['name', 'array', 'optional'] });

  public getUrlState() {
    return { name: this.state.name, array: this.state.array, optional: this.state.optional };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    if (typeof values.name === 'string') {
      this.setState({ name: values.name ?? 'NA' });
    }
    if (Array.isArray(values.array)) {
      this.setState({ array: values.array });
    }
    if (values.hasOwnProperty('optional')) {
      this.setState({ optional: typeof values.optional === 'string' ? values.optional : undefined });
    }
  }
}

describe('UrlSyncManager', () => {
  let urlManager: UrlSyncManager;
  let locationUpdates: Location[] = [];
  let listenUnregister: () => void;
  let scene: SceneObject;
  let deactivate = () => {};

  beforeEach(() => {
    locationUpdates = [];
    listenUnregister = locationService.getHistory().listen((location) => {
      locationUpdates.push(location);
    });
  });

  afterEach(() => {
    deactivate();
    locationService.push('/');
    listenUnregister();
  });

  describe('When state changes', () => {
    it('should update url', () => {
      const obj = new TestObj({ name: 'test' });
      scene = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj })],
      });

      urlManager = new UrlSyncManager(scene);
      urlManager.initSync();

      deactivate = scene.activate();

      // When making state change
      obj.setState({ name: 'test2' });

      // Should update url
      const searchObj = locationService.getSearchObject();
      expect(searchObj.name).toBe('test2');

      // When making unrelated state change
      obj.setState({ other: 'not synced' });

      // Should not update url
      expect(locationUpdates.length).toBe(1);
    });
  });

  describe('When url changes', () => {
    it('should update state', () => {
      const obj = new TestObj({ name: 'test' });
      const initialObjState = obj.state;
      scene = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj })],
      });

      urlManager = new UrlSyncManager(scene);
      urlManager.initSync();

      deactivate = scene.activate();

      // When non relevant key changes in url
      locationService.partial({ someOtherProp: 'test2' });
      // Should not affect state
      expect(obj.state).toBe(initialObjState);

      // When relevant key changes in url
      locationService.partial({ name: 'test2' });
      // Should update state
      expect(obj.state.name).toBe('test2');

      // When relevant key is cleared
      locationService.partial({ name: null });

      // Should revert to initial state
      // expect(obj.state.name).toBe('test');

      // When relevant key is set to current state
      const currentState = obj.state;
      locationService.partial({ name: currentState.name });
      // Should not affect state (same instance)
      expect(obj.state).toBe(currentState);
    });
  });

  describe('When multiple scene objects wants to set same url keys', () => {
    it('should give each object a unique key', () => {
      const outerTimeRange = new SceneTimeRange();
      const innerTimeRange = new SceneTimeRange();

      scene = new SceneFlexLayout({
        children: [
          new SceneFlexItem({
            body: new SceneFlexLayout({
              $timeRange: innerTimeRange,
              children: [],
            }),
          }),
        ],
        $timeRange: outerTimeRange,
      });

      urlManager = new UrlSyncManager(scene);
      urlManager.initSync();

      deactivate = scene.activate();

      // When making state changes for second object with same key
      innerTimeRange.setState({ from: 'now-10m' });

      // Should use unique key based where it is in the scene
      expect(locationService.getSearchObject()).toEqual({
        ['from-2']: 'now-10m',
        ['to-2']: 'now',
      });

      outerTimeRange.setState({ from: 'now-20m' });

      // Should not suffix key for first object
      expect(locationService.getSearchObject()).toEqual({
        from: 'now-20m',
        to: 'now',
        ['from-2']: 'now-10m',
        ['to-2']: 'now',
      });

      // When updating via url
      locationService.partial({ ['from-2']: 'now-10s' });
      // should find the correct object
      expect(innerTimeRange.state.from).toBe('now-10s');
      // should not update the first object
      expect(outerTimeRange.state.from).toBe('now-20m');
      // Should not cause another url update
      expect(locationUpdates.length).toBe(3);
    });
  });

  describe('When updating array value', () => {
    it('Should update url correctly', () => {
      const obj = new TestObj({ name: 'test' });
      scene = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj })],
      });

      urlManager = new UrlSyncManager(scene);
      urlManager.initSync();

      deactivate = scene.activate();

      // When making state change
      obj.setState({ array: ['A', 'B'] });

      // Should update url
      const searchObj = locationService.getSearchObject();
      expect(searchObj.array).toEqual(['A', 'B']);

      // When making unrelated state change
      obj.setState({ other: 'not synced' });

      // Should not update url
      expect(locationUpdates.length).toBe(1);

      // When updating via url
      locationService.partial({ array: ['A', 'B', 'C'] });
      // Should update state
      expect(obj.state.array).toEqual(['A', 'B', 'C']);
    });
  });

  describe('When initial state is undefined', () => {
    it('Should update from url correctly', () => {
      const obj = new TestObj({ name: 'test' });
      scene = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj })],
      });

      urlManager = new UrlSyncManager(scene);
      urlManager.initSync();

      deactivate = scene.activate();

      // When setting value via url
      locationService.partial({ optional: 'handler' });

      // Should update state
      expect(obj.state.optional).toBe('handler');

      // When updating via url and remove optional
      locationService.partial({ optional: null });

      // Should update state
      expect(obj.state.optional).toBe(undefined);
    });

    it('When updating via state and removing from url', () => {
      const obj = new TestObj({ name: 'test' });
      scene = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj })],
      });

      urlManager = new UrlSyncManager(scene);
      urlManager.initSync();

      deactivate = scene.activate();

      obj.setState({ optional: 'handler' });

      // Should update url
      expect(locationService.getSearchObject().optional).toEqual('handler');

      // When updating via url and remove optional
      locationService.partial({ optional: null });

      // Should update state
      expect(obj.state.optional).toBe(undefined);
    });

    it('When removing optional state via state change', () => {
      const obj = new TestObj({ name: 'test' });
      scene = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj })],
      });

      urlManager = new UrlSyncManager(scene);
      urlManager.initSync();

      deactivate = scene.activate();

      obj.setState({ optional: 'handler' });

      expect(locationService.getSearchObject().optional).toEqual('handler');

      obj.setState({ optional: undefined });

      expect(locationService.getSearchObject().optional).toEqual(undefined);
    });
  });
});

describe('isUrlValueEqual', () => {
  it('should handle all cases', () => {
    expect(isUrlValueEqual([], [])).toBe(true);
    expect(isUrlValueEqual([], undefined)).toBe(true);
    expect(isUrlValueEqual([], null)).toBe(true);

    expect(isUrlValueEqual(['asd'], 'asd')).toBe(true);
    expect(isUrlValueEqual(['asd'], ['asd'])).toBe(true);
    expect(isUrlValueEqual(['asd', '2'], ['asd', '2'])).toBe(true);

    expect(isUrlValueEqual(['asd', '2'], 'asd')).toBe(false);
    expect(isUrlValueEqual(['asd2'], 'asd')).toBe(false);
  });
});
