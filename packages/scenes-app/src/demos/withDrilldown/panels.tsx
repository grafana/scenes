import { getFrameDisplayName, ReducerID } from '@grafana/data';
import {
  SceneByFrameRepeater,
  SceneDataNode,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  VizPanel,
} from '@grafana/scenes';
import { FieldColorModeId } from '@grafana/schema';
import { Icon } from '@grafana/ui';
import React from 'react';
import { demoUrl } from '../../utils/utils.routing';

export function getRoomsTemperatureTable() {
  return new VizPanel({
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
                  url: `${demoUrl('with-drilldowns')}/room/\${__value.text}/temperature`,
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
}

export function getRoomsTemperatureStats() {
  return new SceneByFrameRepeater({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [],
    }),
    getLayoutChild: (data, frame, frameIndex) => {
      return new SceneFlexItem({
        key: `panel-${frameIndex}`,
        minHeight: 200,
        $data: new SceneDataNode({
          data: {
            ...data,
            series: [frame],
          },
        }),
        body: new SceneFlexLayout({
          direction: 'row',
          children: [
            new SceneFlexItem({
              body: new VizPanel({
                pluginId: 'timeseries',
                headerActions: (
                  <a
                    className="external-link"
                    href={`${demoUrl('with-drilldowns')}/room/${encodeURIComponent(
                      getFrameDisplayName(frame)
                    )}/temperature`}
                  >
                    <Icon name="arrow-right" />
                    Go to room
                  </a>
                ),
                title: getFrameDisplayName(frame),
                options: {
                  legend: { showLegend: false },
                },
              }),
            }),
            new SceneFlexItem({
              width: 200,
              body: new VizPanel({
                title: 'Last',
                pluginId: 'stat',
                fieldConfig: {
                  defaults: {
                    displayName: 'Last',
                  },
                  overrides: [],
                },
                options: {
                  graphMode: 'none',
                  textMode: 'value',
                },
              }),
            }),
          ],
        }),
      });
    },
  });
}

export function getRoomTemperatureStatPanel(reducers: ReducerID[]) {
  return new VizPanel({
    pluginId: 'stat',
    title: '',
    $data: new SceneDataTransformer({
      transformations: [
        {
          id: 'reduce',
          options: {
            reducers,
          },
        },
      ],
    }),
    fieldConfig: {
      defaults: {
        unit: 'celsius',
      },
      overrides: [],
    },
  });
}
