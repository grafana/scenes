import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneTimeZoneOverride,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from './utils';

export function getTimeZoneTest(defaults: SceneAppPageState) {
  const globalTimeRange = new SceneTimeRange({ timeZone: 'browser' });
  const localTimeRange = new SceneTimeRange({
    from: 'now-5m',
    to: 'now',
  });
  const timeZoneOverride = new SceneTimeZoneOverride({ timeZone: 'America/New_York' });

  const timeseriesPanel = PanelBuilders.timeseries();

  const panel1 = timeseriesPanel
    .setTitle('Using global time range and time zone (${__timezone})')
    .setDescription('This panel should show data within time zone and time range selected in the time picker.')
    .build();

  const panel2 = timeseriesPanel
    .setTitle('Using local range and global time zone (${__timezone})')
    .setDescription('This panel should show data from the last 5 minutes, using time zone from the time picker')
    .build();

  const panel3 = timeseriesPanel
    .setTitle('Using global range, local time zone (${__timezone})')
    .setDescription('This panel should show data using America/New_York time zone and time range from the time picker')
    .build();

  globalTimeRange.subscribeToState(() => {
    panel1.setState({ title: `Using global time range and global time zone: ${globalTimeRange.getTimeZone()}` });
    panel2.setState({ title: `Using local time range and global time zone: ${localTimeRange.getTimeZone()}` });
  });

  timeZoneOverride.subscribeToState((n, p) => {
    panel3.setState({ title: `Using global time range and local time zone: ${timeZoneOverride.getTimeZone()}` });
  });

  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        $timeRange: globalTimeRange,
        controls: [new SceneControlsSpacer(), new SceneTimePicker({}), new SceneRefreshPicker({})],
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
                  body: panel1,
                }),

                new SceneFlexItem({
                  $data: getQueryRunnerWithRandomWalkQuery({}),
                  $timeRange: localTimeRange,
                  minHeight: '200',
                  body: new SceneFlexLayout({
                    direction: 'column',
                    children: [
                      new SceneFlexItem({
                        body: panel2,
                      }),
                    ],
                  }),
                }),
                new SceneFlexItem({
                  $data: getQueryRunnerWithRandomWalkQuery({}),
                  $timeRange: timeZoneOverride,
                  minHeight: '200',
                  body: panel3,
                }),
              ],
            }),
          ],
        }),
      });
    },
  });
}
