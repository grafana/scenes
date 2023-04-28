import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneTimeZoneOverride,
  VizPanel,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getTimeZoneTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Time zones support test',
    getScene: () => {
      return new EmbeddedScene({
        $timeRange: new SceneTimeRange({}),
        controls: [
          new SceneControlsSpacer(),
          new SceneTimePicker({ isOnCanvas: true }),
          new SceneRefreshPicker({ isOnCanvas: true }),
        ],
        key: 'Time zones embedded scene',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              maxHeight: '500',
              children: [
                new SceneFlexItem({
                  $data: getQueryRunnerWithRandomWalkQuery({}),
                  minHeight: '200',
                  body: new VizPanel({
                    pluginId: 'timeseries',
                    title: 'Using global time range and time zone',
                  }),
                }),
                new SceneFlexItem({
                  $data: getQueryRunnerWithRandomWalkQuery({}),
                  $timeRange: new SceneTimeRange({
                    from: 'now-5m',
                    to: 'now',
                  }),
                  minHeight: '200',
                  body: new SceneFlexLayout({
                    direction: 'column',
                    children: [
                      new SceneFlexItem({
                        body: new SceneTimePicker({ isOnCanvas: true }),
                        ySizing: 'content',
                      }),
                      new SceneFlexItem({
                        body: new VizPanel({
                          pluginId: 'timeseries',
                          title: 'Using global time zone, local range',
                        }),
                      }),
                    ],
                  }),
                }),
                new SceneFlexItem({
                  $data: getQueryRunnerWithRandomWalkQuery({}),
                  $timeRange: new SceneTimeZoneOverride({ timeZone: 'Australia/Broken_Hill' }),
                  minHeight: '200',
                  body: new VizPanel({
                    pluginId: 'timeseries',
                    title: 'Using global range, local time zone',
                  }),
                }),
              ],
            }),
          ],
        }),
      });
    },
  });
}
