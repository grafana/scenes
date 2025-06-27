import { Location } from 'history';

import { locationService } from '@grafana/runtime';

import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneObjectState, SceneObjectUrlValues } from '../core/types';

import { SceneObjectUrlSyncConfig } from './SceneObjectUrlSyncConfig';
import { UrlSyncManager } from './UrlSyncManager';
import { activateFullSceneTree } from '../utils/test/activateFullSceneTree';
import { updateUrlStateAndSyncState } from '../../utils/test/updateUrlStateAndSyncState';

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

    if (values.hasOwnProperty('nested') && !this.state.nested) {
      this.setState({ nested: new TestObj({ name: 'default name' }) });
    }
  }
}

describe.each([
  ['Without namespace', undefined],
  ['With a namespace', { namespace: 'ns' }],
])('UrlSyncManager', (msg, options) => {
  let urlManager: UrlSyncManager;
  let locationUpdates: Location[] = [];
  let listenUnregister: () => void;
  let scene: SceneFlexLayout;
  let deactivate = () => {};

  beforeEach(() => {
    locationUpdates = [];
    deactivate = () => {};
    listenUnregister = locationService.getHistory().listen((location) => {
      locationUpdates.push(location);
    });
  });

  afterEach(() => {
    deactivate();
    listenUnregister();
    urlManager.cleanUp(scene);
    locationService.push('/');
  });

  describe(msg, () => {
    describe('getUrlState', () => {
      it('returns the full url state', () => {
        const obj = new TestObj({ name: 'test', optional: 'handler', array: ['A', 'B'] });
        scene = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj })],
        });

        urlManager = new UrlSyncManager(options);

        if (!options) {
          expect(urlManager.getUrlState(scene)).toEqual({
            name: 'test',
            optional: 'handler',
            array: ['A', 'B'],
          });
        } else {
          expect(urlManager.getUrlState(scene)).toEqual({
            'ns-name': 'test',
            'ns-optional': 'handler',
            'ns-array': ['A', 'B'],
          });
        }
      });
    });

    describe('When state changes', () => {
      it('should update url', () => {
        const obj = new TestObj({ name: 'test' });
        scene = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj })],
        });

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene);

        deactivate = scene.activate();

        // When making state change
        obj.setState({ name: 'test2' });

        // Should update url
        const searchObj = locationService.getSearchObject();

        const paramName = !options ? 'name' : `${options.namespace}-name`;
        expect(searchObj[paramName]).toBe('test2');

        // When making unrelated state change
        obj.setState({ other: 'not synced' });

        // Should not update url
        expect(locationUpdates.length).toBe(1);
      });
    });

    describe('Initiating url from state', () => {
      it('Should sync initial scene state with url', () => {
        const obj = new TestObj({ name: 'test' });
        scene = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj })],
        });

        urlManager = new UrlSyncManager({ ...options, updateUrlOnInit: true });
        urlManager.initSync(scene);

        expect(locationUpdates.length).toBe(1);

        const paramName = !options ? 'name' : `${options.namespace}-name`;
        expect(locationUpdates[0].search).toBe(`?${paramName}=test`);
      });

      it('Should not update url if there is no difference', () => {
        const obj = new TestObj({ name: 'test' });
        scene = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj })],
        });

        locationService.partial({ name: 'test' });

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene);

        expect(locationUpdates.length).toBe(1);
      });
    });

    describe('Initiating state from url', () => {
      it('Should sync nested objects created during sync', () => {
        const obj = new TestObj({ name: 'test' });
        scene = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj })],
        });

        const query = !options
          ? { name: 'name-from-url', nested: 'nested', 'name-2': 'nested name from initial url' }
          : {
              [`${options.namespace}-name`]: 'name-from-url',
              [`${options.namespace}-nested`]: 'nested',
              [`${options.namespace}-name-2`]: 'nested name from initial url',
            };

        locationService.partial(query);

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene);

        deactivate = scene.activate();

        expect(obj.state.nested?.state.name).toBe('nested name from initial url');
      });

      it('Should update scene state from url for objects created after initial sync', () => {
        scene = new SceneFlexLayout({ children: [] });

        const query = !options
          ? { name: 'name-from-url' }
          : {
              [`${options.namespace}-name`]: 'name-from-url',
            };

        locationService.partial(query);

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene);

        deactivate = scene.activate();

        const obj = new TestObj({ name: 'test' });
        urlManager.handleNewObject(obj);

        scene.setState({ children: [new SceneFlexItem({ body: obj })] });

        expect(obj.state.name).toEqual('name-from-url');
      });
    });

    describe('When url changes', () => {
      it('should update state', () => {
        const obj = new TestObj({ name: 'test' });
        const initialObjState = obj.state;
        scene = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj })],
        });

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene);

        deactivate = scene.activate();

        // When non relevant key changes in url
        updateUrlStateAndSyncState({ someOtherProp: 'test2' }, urlManager);

        // Should not affect state
        expect(obj.state).toBe(initialObjState);

        const paramName = !options ? 'name' : `${options.namespace}-name`;

        // When relevant key changes in url
        updateUrlStateAndSyncState({ [paramName]: 'test2' }, urlManager);

        // Should update state
        expect(obj.state.name).toBe('test2');

        // When relevant key is cleared
        updateUrlStateAndSyncState({ [paramName]: null }, urlManager);

        // When relevant key is set to current state
        const currentState = obj.state;
        updateUrlStateAndSyncState({ [paramName]: currentState.name }, urlManager);
        // Should not affect state (same instance)
        expect(obj.state).toBe(currentState);
      });

      it('should ignore location update when handleNewLocation is not called', () => {
        const obj = new TestObj({ name: 'test' });
        scene = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj })],
        });

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene);

        deactivate = scene.activate();

        obj.setState({ optional: 'newValue' });

        // Should not affect state
        const paramName = !options ? 'optional' : `${options.namespace}-optional`;
        expect(locationService.getSearchObject()[paramName]).toBe('newValue');

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

        urlManager = new UrlSyncManager({ ...options, updateUrlOnInit: true });
        urlManager.initSync(scene);

        deactivate = scene.activate();

        // When making state changes for second object with same key
        innerTimeRange.setState({ from: 'now-10m' });

        // Should use unique key based where it is in the scene
        expect(locationService.getSearchObject()).toEqual({
          from: 'now-6h',
          ['from-2']: 'now-10m',
          timezone: 'browser',
          to: 'now',
          ['to-2']: 'now',
          ['timezone-2']: 'browser',
        });

        outerTimeRange.setState({ from: 'now-20m' });

        // Should not suffix key for first object
        expect(locationService.getSearchObject()).toEqual({
          from: 'now-20m',
          to: 'now',
          timezone: 'browser',
          ['from-2']: 'now-10m',
          ['to-2']: 'now',
          ['timezone-2']: 'browser',
        });

        // When updating via url
        updateUrlStateAndSyncState({ ['from-2']: 'now-10s' }, urlManager);
        // should find the correct object
        expect(innerTimeRange.state.from).toBe('now-10s');
        // should not update the first object
        expect(outerTimeRange.state.from).toBe('now-20m');
        // Should not cause another url update
        expect(locationUpdates.length).toBe(4);
      });

      it('should handle dynamically added objects that use same key', () => {
        const outerTimeRange = new SceneTimeRange();
        const layout = new SceneFlexLayout({ children: [] });

        scene = new SceneFlexLayout({
          children: [
            new SceneFlexItem({
              body: layout,
            }),
          ],
          $timeRange: outerTimeRange,
        });

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene);

        deactivate = scene.activate();

        outerTimeRange.setState({ from: 'now-20m' });

        const dynamicallyAddedTimeRange = new SceneTimeRange();
        layout.setState({ $timeRange: dynamicallyAddedTimeRange });

        dynamicallyAddedTimeRange.setState({ from: 'now-5m' });

        // Should use unique key based where it is in the scene
        expect(locationService.getSearchObject()['from-2']).toBe('now-5m');

        // Now set a new instance of the time range (making the prevous time range an orphan)
        const dynamicallyAddedTimeRange2 = new SceneTimeRange();
        layout.setState({ $timeRange: dynamicallyAddedTimeRange2 });

        dynamicallyAddedTimeRange2.setState({ from: 'now-1s' });
        // should still use same key
        expect(locationService.getSearchObject()['from-2']).toBe('now-1s');
      });
    });

    describe('When updating array value', () => {
      it('Should update url correctly', () => {
        const obj = new TestObj({ name: 'test' });
        scene = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj })],
        });

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene);

        deactivate = scene.activate();

        // When making state change
        obj.setState({ array: ['A', 'B'] });

        // Should update url
        const searchObj = locationService.getSearchObject();
        const paramName = !options ? 'array' : `${options.namespace}-array`;
        expect(searchObj[paramName]).toEqual(['A', 'B']);

        // When making unrelated state change
        obj.setState({ other: 'not synced' });

        // Should not update url
        expect(locationUpdates.length).toBe(1);

        // When updating via url
        updateUrlStateAndSyncState({ [paramName]: ['A', 'B', 'C'] }, urlManager);

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

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene);

        deactivate = scene.activate();

        const paramName = !options ? 'optional' : `${options.namespace}-optional`;

        // When setting value via url
        updateUrlStateAndSyncState({ [paramName]: 'handler' }, urlManager);

        // Should update state
        expect(obj.state.optional).toBe('handler');

        // When updating via url and remove optional
        updateUrlStateAndSyncState({ [paramName]: null }, urlManager);

        // Should update state
        expect(obj.state.optional).toBe(undefined);
      });

      it('When updating via state and removing from url', () => {
        const obj = new TestObj({ name: 'test' });
        scene = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj })],
        });

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene);

        deactivate = scene.activate();

        obj.setState({ optional: 'handler' });

        const paramName = !options ? 'optional' : `${options.namespace}-optional`;

        // Should update url
        expect(locationService.getSearchObject()[paramName]).toEqual('handler');

        // When updating via url and remove optional
        updateUrlStateAndSyncState({ [paramName]: null }, urlManager);

        // Should update state
        expect(obj.state.optional).toBe(undefined);
      });

      it('When removing optional state via state change', () => {
        const obj = new TestObj({ name: 'test' });
        scene = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj })],
        });

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene);

        deactivate = scene.activate();

        obj.setState({ optional: 'handler' });

        const paramName = !options ? 'optional' : `${options.namespace}-optional`;

        expect(locationService.getSearchObject()[paramName]).toEqual('handler');

        obj.setState({ optional: undefined });

        expect(locationService.getSearchObject()[paramName]).toEqual(undefined);
      });
    });

    describe('When moving between scene roots', () => {
      it('Should unsub from previous scene', () => {
        const obj1 = new TestObj({ name: 'A' });
        const scene1 = new SceneFlexLayout({
          children: [obj1],
        });

        urlManager = new UrlSyncManager(options);
        urlManager.initSync(scene1);

        deactivate = scene1.activate();

        obj1.setState({ name: 'B' });

        const paramName = !options ? 'name' : `${options.namespace}-name`;

        // Should update url
        expect(locationService.getSearchObject()[paramName]).toEqual('B');

        const obj2 = new TestObj({ name: 'test' });
        const scene2 = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj2 })],
        });

        urlManager.initSync(scene2);

        obj1.setState({ name: 'new name' });

        // Should not update url
        expect(locationService.getSearchObject()[paramName]).toEqual('B');
      });

      it('cleanUp should unsub from state', () => {
        const obj1 = new TestObj({ name: 'A' });
        const scene1 = new SceneFlexLayout({
          children: [obj1],
        });

        urlManager = new UrlSyncManager({ ...options, updateUrlOnInit: true });
        urlManager.initSync(scene1);

        deactivate = scene1.activate();

        urlManager.cleanUp(scene1);

        obj1.setState({ name: 'B' });

        const paramName = !options ? 'name' : `${options.namespace}-name`;

        // Should not update url
        expect(locationService.getSearchObject()[paramName]).toBe('A');

        // When updating via url
        updateUrlStateAndSyncState({ [paramName]: 'Hello' }, urlManager);

        // Should not update state
        expect(obj1.state.name).toBe('B');
      });
    });

    describe('When a state update triggers another state update with url sync', () => {
      it('Should update url correctly', async () => {
        const obj1 = new TestObj({ name: 'test1' });
        const obj2 = new TestObj({ name: 'test2' });

        scene = new SceneFlexLayout({
          children: [new SceneFlexItem({ body: obj1 }), new SceneFlexItem({ body: obj2 })],
        });

        urlManager = new UrlSyncManager(options);

        // subscribe to obj1 state and set obj2 state name
        obj1.subscribeToState((state) => {
          obj2.setState({ name: state.name });
        });

        const location = !options
          ? '?name=test1&name-2=test2'
          : `?${options.namespace}-name=test1&${options.namespace}-name-2=test2`;

        locationService.push(location);
        urlManager.initSync(scene);

        deactivate = activateFullSceneTree(scene);

        obj1.setState({ name: 'A' });

        if (!options) {
          expect(locationService.getLocation().search).toEqual('?name=A&name-2=A');
        } else {
          expect(locationService.getLocation().search).toEqual(
            `?${options.namespace}-name=A&${options.namespace}-name-2=A`
          );
        }
      });
    });

    describe('When init sync root is not scene root', () => {
      it('Should sync init root', async () => {
        const scene = new TestObj({
          name: 'scene-root',
          nested: new TestObj({
            name: 'url-sync-root',
          }),
        });

        urlManager = new UrlSyncManager(options);

        const location = !options ? '?name=test1' : `?${options.namespace}-name=test1`;

        locationService.push(location);
        urlManager.initSync(scene.state.nested!);

        deactivate = activateFullSceneTree(scene);

        // Only updated the nested scene (as it's the only part of scene tree that is synced)
        expect(scene.state.nested?.state.name).toEqual('test1');

        // Unchanged
        expect(scene.state.name).toEqual('scene-root');
      });
    });
  });
});
