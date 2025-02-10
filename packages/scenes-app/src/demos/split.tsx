import React from 'react';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneCanvasText,
  SceneDataTransformer,
  SceneFlexItem,
  SceneQueryRunner,
  SplitLayout,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';
import { demoUrl } from '../utils/utils.routing';
import { DATASOURCE_REF } from '../constants';
import { BarGaugeDisplayMode, FieldColorModeId, TableCellDisplayMode } from '@grafana/schema';
import { DataLinkClickEvent } from '@grafana/data';
import { getRoomTemperatureQuery } from './withDrilldown/scenes';
import { IconButton } from '@grafana/ui';

const basicDemo = () =>
  new SceneAppPage({
    title: 'Split layout test',
    url: demoUrl('split-layout'),
    routePath: 'split-layout/*',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Flex layout embedded scene',
        body: new SplitLayout({
          initialSize: 0.7,
          direction: 'row',
          primary: new SceneFlexItem({
            minWidth: 300,
            body: PanelBuilders.timeseries()
              .setTitle('Dynamic height and width')
              .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }))
              .build(),
          }),

          secondary: new SceneFlexItem({
            minWidth: 300,
            body: new SplitLayout({
              ySizing: 'content',
              direction: 'column',
              primary: new SceneFlexItem({
                minHeight: 200,
                body: PanelBuilders.timeseries()
                  .setTitle('Dynamic height and width')
                  .setData(getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }))
                  .build(),
              }),
              secondary: new SceneFlexItem({
                minHeight: 200,
                body: new SceneCanvasText({
                  text: 'Blah blah',
                  fontSize: 30,
                  align: 'center',
                }),
              }),
            }),
          }),
        }),
      });
    },
  });

const roomsTemperatureQuery = {
  refId: 'Rooms temperature',
  datasource: DATASOURCE_REF,
  scenarioId: 'random_walk',
  seriesCount: 8,
  alias: '__house_locations',
  min: 10,
  max: 27,
};

const getDynamicSplitScene = () => {
  const defaultSecondary = new SceneFlexItem({
    minWidth: 500,
    body: new SceneCanvasText({
      text: 'Select room to see details',
      fontSize: 20,
      align: 'center',
    }),
  });
  const runner = new SceneQueryRunner({
    datasource: DATASOURCE_REF,
    queries: [roomsTemperatureQuery],
    maxDataPoints: 100,
  });

  const table = PanelBuilders.table()
    .setData(
      new SceneDataTransformer({
        transformations: [
          {
            id: 'reduce',
            options: {
              reducers: ['mean'],
            },
          },
          {
            id: 'organize',
            options: {
              excludeByName: {},
              indexByName: {},
              renameByName: {
                Field: 'Room',
                Mean: 'Average temperature',
              },
            },
          },
        ],
      })
    )
    .setTitle('Room temperature overview')
    .setOption('sortBy', [{ displayName: 'Average temperature' }])
    .setCustomFieldConfig('align', 'auto')
    .setCustomFieldConfig('cellOptions', { type: TableCellDisplayMode.Auto })
    .setCustomFieldConfig('inspect', false)
    .setColor({ mode: FieldColorModeId.ContinuousGrYlRd })
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Average temperature')
        .overrideUnit('celsius')
        .overrideCustomFieldConfig('align', 'center')
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.Gauge,
          mode: BarGaugeDisplayMode.Gradient,
        })
        .matchFieldsWithName('Room')
        .overrideLinks([
          {
            title: 'Go to room overview',
            url: '',
            onClick: (e: DataLinkClickEvent) => {
              const roomName = e.origin.field.values.get(e.origin.rowIndex);
              splitter.setState({
                secondary: new SceneFlexItem({
                  minWidth: 500,
                  body: PanelBuilders.timeseries()
                    .setTitle(`${roomName} temperature`)
                    .setData(
                      new SceneQueryRunner({
                        datasource: DATASOURCE_REF,
                        queries: [getRoomTemperatureQuery(roomName)],
                      })
                    )
                    .setHeaderActions(
                      <label>
                        <IconButton
                          name="trash-alt"
                          type="button"
                          onClick={() => splitter.setState({ secondary: undefined })}
                          aria-label="remove right part"
                        />
                        <IconButton
                          name="times"
                          type="button"
                          onClick={() => splitter.setState({ secondary: defaultSecondary })}
                          aria-label="clear right part"
                        />
                      </label>
                    )
                    .build(),
                }),
              });
            },
          },
        ])
        .overrideCustomFieldConfig('width', 250)
    )
    .build();

  const splitter = new SplitLayout({
    direction: 'row',
    primary: new SceneFlexItem({
      body: table,
      minWidth: 300,
    }),
    secondary: defaultSecondary,
  });

  return new EmbeddedScene({
    ...getEmbeddedSceneDefaults(),
    key: 'Flex layout embedded scene',
    $data: runner,
    body: splitter,
  });
};

const dynamicSplitDemo = () =>
  new SceneAppPage({
    title: 'Dynamic split layout test',
    url: demoUrl('split-layout/dynamic'),
    routePath: 'dynamic',
    getScene: getDynamicSplitScene,
  });

export function getSplitTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    url: demoUrl('split-layout'),
    tabs: [basicDemo(), dynamicSplitDemo()],
  });
}
