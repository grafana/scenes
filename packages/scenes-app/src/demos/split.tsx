import React from 'react';
import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneCanvasText,
  SceneDataTransformer,
  SceneFlexItem,
  SceneQueryRunner,
  SplitLayout,
  VizPanel,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery, getEmbeddedSceneDefaults } from './utils';
import { demoUrl } from '../utils/utils.routing';
import { DATASOURCE_REF } from '../constants';
import { FieldColorModeId } from '@grafana/schema';
import { DataLinkClickEvent } from '@grafana/data';
import { getRoomTemperatureQuery } from './withDrilldown/scenes';
import { IconButton } from '@grafana/ui';

const basicDemo = () =>
  new SceneAppPage({
    title: 'Split layout test',
    url: demoUrl('split-layout'),
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Flex layout embedded scene',
        body: new SplitLayout({
          direction: 'row',
          primary: new VizPanel({
            pluginId: 'timeseries',
            title: 'Dynamic height and width',
            $data: getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }),
          }),
          secondary: new SplitLayout({
            ySizing: 'content',
            direction: 'column',
            primary: new SceneCanvasText({
              text: 'Size to content',
              fontSize: 20,
              align: 'center',
            }),
            secondary: new SceneCanvasText({
              text: 'Blah blah',
              fontSize: 30,
              align: 'center',
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

  const table = new VizPanel({
    pluginId: 'table',
    $data: new SceneDataTransformer({
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
    }),
    title: 'Room temperature overview',
    options: {
      sortBy: ['Average temperature'],
    },
    fieldConfig: {
      defaults: {
        custom: {
          align: 'auto',
          cellOptions: {
            type: 'auto',
          },
          inspect: false,
        },
        mappings: [],
        color: {
          mode: FieldColorModeId.ContinuousGrYlRd,
        },
      },
      overrides: [
        {
          matcher: {
            id: 'byName',
            options: 'Average temperature',
          },
          properties: [
            {
              id: 'unit',
              value: 'celsius',
            },
            {
              id: 'custom.cellOptions',
              value: {
                type: 'gauge',
                mode: 'gradient',
              },
            },
            {
              id: 'custom.align',
              value: 'center',
            },
          ],
        },
        {
          matcher: {
            id: 'byName',
            options: 'Room',
          },
          properties: [
            {
              id: 'links',
              value: [
                {
                  title: 'Go to room overview',
                  onClick: (e: DataLinkClickEvent) => {
                    const roomName = e.origin.field.values.get(e.origin.rowIndex);
                    splitter.setState({
                      secondary: new SceneFlexItem({
                        minWidth: 500,
                        body: new VizPanel({
                          title: `${roomName} temperature`,
                          $data: new SceneQueryRunner({
                            datasource: DATASOURCE_REF,
                            queries: [getRoomTemperatureQuery(roomName)],
                          }),
                          headerActions: (
                            <IconButton name="x" onClick={() => splitter.setState({ secondary: defaultSecondary })} />
                          ),
                        }),
                      }),
                    });
                  },
                },
              ],
            },
            {
              id: 'custom.width',
              value: 250,
            },
          ],
        },
      ],
    },
  });

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
    getScene: getDynamicSplitScene,
  });

export function getSplitTest(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'A demo of split layout options',
    url: demoUrl('split-layout'),
    tabs: [basicDemo(), dynamicSplitDemo()],
  });
}
