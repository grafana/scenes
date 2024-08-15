import { getFrameDisplayName, ReducerID } from '@grafana/data';
import {
  PanelBuilders,
  SceneByFrameRepeater,
  SceneDataNode,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
} from '@grafana/scenes';
import {
  BarGaugeDisplayMode,
  BigValueGraphMode,
  BigValueTextMode,
  FieldColorModeId,
  TableCellDisplayMode,
} from '@grafana/schema';
import { Icon } from '@grafana/ui';
import React from 'react';
import { demoUrl } from '../../utils/utils.routing';

export function getRoomsTemperatureTable() {
  const data = new SceneDataTransformer({
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
  });
  return PanelBuilders.table()
    .setData(data)
    .setTitle('Room temperature overview')
    .setOption('sortBy', [
      {
        displayName: 'Average temperature',
      },
    ])
    .setColor({
      mode: FieldColorModeId.ContinuousGrYlRd,
    })
    .setCustomFieldConfig('align', 'auto')
    .setCustomFieldConfig('cellOptions', {
      type: TableCellDisplayMode.Auto,
    })
    .setCustomFieldConfig('inspect', false)
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Average temperature')
        .overrideUnit('celsius')
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.Gauge,
          mode: BarGaugeDisplayMode.Gradient,
        })
        .overrideCustomFieldConfig('align', 'center')
        .matchFieldsWithName('Room')
        .overrideLinks([
          {
            title: 'Go to room overview',
            url: '${__url.path}/room/${__value.text}/temperature',
          },
        ])
        .overrideCustomFieldConfig('width', 250)
    )
    .build();
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
              body: PanelBuilders.timeseries()
                .setTitle(getFrameDisplayName(frame))
                .setOption('legend', { showLegend: false })
                .setHeaderActions(
                  <a
                    className="external-link"
                    href={`${demoUrl('with-drilldowns')}/room/${encodeURIComponent(
                      getFrameDisplayName(frame)
                    )}/temperature`}
                  >
                    <Icon name="arrow-right" />
                    Go to room
                  </a>
                )
                .build(),
            }),
            new SceneFlexItem({
              width: 200,
              body: PanelBuilders.stat()
                .setTitle('Last')
                .setOption('graphMode', BigValueGraphMode.None)
                .setOption('textMode', BigValueTextMode.Value)
                .setDisplayName('Last')
                .build(),
            }),
          ],
        }),
      });
    },
  });
}

export function getRoomTemperatureStatPanel(reducers: ReducerID[]) {
  const data = new SceneDataTransformer({
    transformations: [
      {
        id: 'reduce',
        options: {
          reducers,
        },
      },
    ],
  });

  return PanelBuilders.stat().setData(data).setUnit('celsius').build();
}
