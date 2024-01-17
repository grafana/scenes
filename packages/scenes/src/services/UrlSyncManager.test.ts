import { Location } from 'history';

import { locationService } from '@grafana/runtime';

import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneObjectState, SceneObjectUrlValues } from '../core/types';

import { SceneObjectUrlSyncConfig } from './SceneObjectUrlSyncConfig';
import { UrlSyncManager } from './UrlSyncManager';

interface TestObjectState extends SceneObjectState {
  name: string;
  optional?: string;
  array?: string[];
  other?: string;
  nested?: TestObj;
}

class TestObj extends SceneObjectBase<TestObjectState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['name', 'array', 'optional', 'nested'] });

  public getUrlState() {
    return {
      name: this.state.name,
      array: this.state.array,
      optional: this.state.optional,
      nested: this.state.nested ? 'nested' : undefined,
    };
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

    if (values.hasOwnProperty('nested')) {
      this.setState({ nested: new TestObj({ name: 'default name' }) });
    } else if (this.state.nested) {
      this.setState({ nested: undefined });
    }
  }
}

describe('UrlSyncManager', () => {
  let urlManager: UrlSyncManager;
  let locationUpdates: Location[] = [];
  let listenUnregister: () => void;
  let scene: SceneFlexLayout;
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
    urlManager.cleanUp(scene);
  });

  describe('getUrlState', () => {
    it('returns the full url state', () => {
      const obj = new TestObj({ name: 'test', optional: 'handler', array: ['A', 'B'] });
      scene = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj })],
      });

      urlManager = new UrlSyncManager();

      expect(urlManager.getUrlState(scene)).toEqual({
        name: 'test',
        optional: 'handler',
        array: ['A', 'B'],
      });
    });
  });

  describe('When state changes', () => {
    it('should update url', () => {
      const obj = new TestObj({ name: 'test' });
      scene = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj })],
      });

      urlManager = new UrlSyncManager();
      urlManager.initSync(scene);

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

  describe('Initiating state from url', () => {
    it('Should sync nested objects created during sync', () => {
      const obj = new TestObj({ name: 'test' });
      scene = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj })],
      });

      locationService.partial({ name: 'name-from-url', nested: 'nested', 'name-2': 'nested name from initial url' });

      urlManager = new UrlSyncManager();
      urlManager.initSync(scene);

      deactivate = scene.activate();

      expect(obj.state.nested?.state.name).toEqual('nested name from initial url');
    });

    // it('Should get url state from with objects created after initial sync', () => {
    //   const obj = new TestObj({ name: 'test' });
    //   scene = new SceneFlexLayout({
    //     children: [],
    //   });

    //   locationService.partial({ name: 'name-from-url' });

    //   urlManager = new UrlSyncManager();
    //   urlManager.initSync(scene);

    //   deactivate = scene.activate();

    //   scene.setState({ children: [new SceneFlexItem({ body: obj })] });

    //   expect(obj.state.name).toEqual('name-from-url');
    // });
  });

  describe('When url changes', () => {
    it('should update state', () => {
      const obj = new TestObj({ name: 'test' });
      const initialObjState = obj.state;
      scene = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj })],
      });

      urlManager = new UrlSyncManager();
      urlManager.initSync(scene);

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

    it('should ignore state update when path also changed', () => {
      const obj = new TestObj({ name: 'test' });
      scene = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj })],
      });

      urlManager = new UrlSyncManager();
      urlManager.initSync(scene);

      deactivate = scene.activate();

      obj.setState({ optional: 'newValue' });

      // Should not affect state
      expect(locationService.getSearchObject().optional).toBe('newValue');

      // Move to new path
      locationService.push('/new/path');

      // Expect state to remain
      expect(obj.state.optional).toBe('newValue');
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

      urlManager = new UrlSyncManager();
      urlManager.initSync(scene);

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

      urlManager = new UrlSyncManager();
      urlManager.initSync(scene);

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

      urlManager = new UrlSyncManager();
      urlManager.initSync(scene);

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

      urlManager = new UrlSyncManager();
      urlManager.initSync(scene);

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

      urlManager = new UrlSyncManager();
      urlManager.initSync(scene);

      deactivate = scene.activate();

      obj.setState({ optional: 'handler' });

      expect(locationService.getSearchObject().optional).toEqual('handler');

      obj.setState({ optional: undefined });

      expect(locationService.getSearchObject().optional).toEqual(undefined);
    });
  });

  describe('When moving between scene roots', () => {
    it('Should unsub from previous scene', () => {
      const obj1 = new TestObj({ name: 'A' });
      const scene1 = new SceneFlexLayout({
        children: [obj1],
      });

      urlManager = new UrlSyncManager();
      urlManager.initSync(scene1);

      deactivate = scene1.activate();

      obj1.setState({ name: 'B' });

      // Should update url
      expect(locationService.getSearchObject().name).toEqual('B');

      const obj2 = new TestObj({ name: 'test' });
      const scene2 = new SceneFlexLayout({
        children: [new SceneFlexItem({ body: obj2 })],
      });

      urlManager.initSync(scene2);

      obj1.setState({ name: 'new name' });

      // Should not update url
      expect(locationService.getSearchObject().name).toEqual('B');
    });

    it('cleanUp should unsub from state and history', () => {
      const obj1 = new TestObj({ name: 'A' });
      const scene1 = new SceneFlexLayout({
        children: [obj1],
      });

      urlManager = new UrlSyncManager();
      urlManager.initSync(scene1);

      deactivate = scene1.activate();

      urlManager.cleanUp(scene1);

      obj1.setState({ name: 'B' });

      // Should not update url
      expect(locationService.getSearchObject().name).toBeUndefined();

      // When updating via url
      locationService.partial({ name: 'Hello' });

      // Should not update state
      expect(obj1.state.name).toBe('B');
    });
  });
});
