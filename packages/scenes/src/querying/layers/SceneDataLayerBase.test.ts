import { getDefaultTimeRange } from '@grafana/data';
import { LoadingState } from '@grafana/schema';
import { SceneDataProviderResult } from '../../core/types';
import { TestAnnotationsDataLayer } from './TestDataLayer';

describe('SceneDataLayerBase', () => {
  const runLayerSpy = jest.fn();
  const enableSpy = jest.fn();
  const disableSpy = jest.fn();

  beforeEach(() => {
    enableSpy.mockClear();
    disableSpy.mockClear();
    runLayerSpy.mockClear();
  });

  describe('when activated', () => {
    it('should not run layer if disabled', () => {
      const layer = new TestAnnotationsDataLayer({
        name: 'Test layer',
        isEnabled: false,
        runLayerSpy: runLayerSpy,
      });

      layer.activate();

      expect(runLayerSpy).toBeCalledTimes(0);
    });

    it('should run query when there is no data', () => {
      const layer = new TestAnnotationsDataLayer({
        name: 'Layer 1',
        isEnabled: true,
        runLayerSpy: runLayerSpy,
      });
      layer.activate();

      expect(runLayerSpy).toBeCalledTimes(1);
    });

    it('should not run query there is data', () => {
      const layer = new TestAnnotationsDataLayer({
        name: 'Layer 1',
        isEnabled: true,
        runLayerSpy: runLayerSpy,
        data: {
          annotations: [],
          series: [],
          state: LoadingState.Done,
          timeRange: getDefaultTimeRange(),
        },
      });

      layer.activate();

      expect(runLayerSpy).toBeCalledTimes(0);
    });
  });

  describe('when enabled', () => {
    it('should call onEnable handler when activated', () => {
      const layer = new TestAnnotationsDataLayer({
        name: 'Layer 1',
        isEnabled: true,
        onEnableSpy: enableSpy,
        onDisableSpy: disableSpy,
      });
      layer.activate();

      expect(enableSpy).toBeCalledTimes(1);
      expect(disableSpy).not.toBeCalled();
    });

    it('should call onDisable handler when activated', () => {
      const layer = new TestAnnotationsDataLayer({
        name: 'Layer 1',
        isEnabled: true,
        onEnableSpy: enableSpy,
        onDisableSpy: disableSpy,
      });
      const deactivate = layer.activate();

      deactivate();

      expect(enableSpy).toBeCalledTimes(1);
      expect(disableSpy).toBeCalledTimes(1);
    });
  });

  describe('when disabled', () => {
    it('should not call onEnable handler when activated', () => {
      const layer = new TestAnnotationsDataLayer({
        name: 'Layer 1',
        isEnabled: false,
        onEnableSpy: enableSpy,
        onDisableSpy: disableSpy,
      });
      layer.activate();

      expect(enableSpy).not.toBeCalled();
      expect(disableSpy).not.toBeCalled();
    });

    it('should call onDisable handler when activated', () => {
      const layer = new TestAnnotationsDataLayer({
        name: 'Layer 1',
        isEnabled: false,
        onEnableSpy: enableSpy,
        onDisableSpy: disableSpy,
      });
      const deactivate = layer.activate();

      deactivate();

      expect(enableSpy).not.toBeCalled();
      expect(disableSpy).toBeCalledTimes(1);
    });
  });

  describe('when disabling', () => {
    it('should emit empty results and call onDisable handler', (done) => {
      let result: SceneDataProviderResult | undefined = undefined;

      const layer = new TestAnnotationsDataLayer({
        name: 'Layer 1',
        isEnabled: true,
        onEnableSpy: enableSpy,
        onDisableSpy: disableSpy,
      });

      layer.activate();

      layer.getResultsStream().subscribe((r) => {
        result = r;
        done();
      });

      layer.setState({ isEnabled: false });

      expect(result).toBeDefined();
      expect(result!.data.series).toEqual([]);
      expect(result!.data.state).toEqual(LoadingState.Done);
      expect(disableSpy).toBeCalledTimes(1);
    });
  });

  describe('when enabling', () => {
    it('should call onEnable handler', (done) => {
      let result: SceneDataProviderResult | undefined = undefined;

      const layer = new TestAnnotationsDataLayer({
        name: 'Layer 1',
        isEnabled: false,
        onEnableSpy: enableSpy,
        onDisableSpy: disableSpy,
      });

      layer.activate();

      expect(enableSpy).not.toBeCalled();

      layer.getResultsStream().subscribe((r) => {
        result = r;
        done();
      });

      layer.setState({ isEnabled: true });

      expect(enableSpy).toBeCalledTimes(1);

      layer.completeRun();

      expect(result).toBeDefined();
      expect(result!.data.series).toMatchInlineSnapshot(`
        [
          {
            "fields": [
              {
                "config": {},
                "name": "time",
                "type": "time",
                "values": [
                  100,
                ],
              },
              {
                "config": {},
                "name": "text",
                "type": "string",
                "values": [
                  "Layer 1: Test annotation",
                ],
              },
              {
                "config": {},
                "name": "tags",
                "type": "other",
                "values": [
                  [
                    "tag1",
                  ],
                ],
              },
            ],
            "length": 1,
            "meta": {
              "dataTopic": "annotations",
            },
          },
        ]
      `);
      expect(result!.data.state).toEqual(LoadingState.Done);
    });
  });
});
