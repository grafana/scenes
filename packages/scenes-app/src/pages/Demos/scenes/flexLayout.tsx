import React, { useMemo } from 'react';
import {
  EmbeddedScene,
  SceneCanvasText,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneObjectStatePlain,
  VizPanel,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from '../utils';

export function getFlexLayoutTest() {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          ySizing: 'fill',
          xSizing: 'fill',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  minWidth: '70%',
                  children: [
                    new VizPanel({
                      pluginId: 'timeseries',
                      title: 'Dynamic height and width',
                      $data: getQueryRunnerWithRandomWalkQuery({}, { maxDataPointsFromWidth: true }),
                    }),
                  ],
                }),
                new SceneFlexItem({
                  children: [
                    new SceneFlexLayout({
                      $data: getQueryRunnerWithRandomWalkQuery(),
                      direction: 'column',
                      children: [
                        new SceneFlexItem({
                          children: [
                            new VizPanel({
                              pluginId: 'timeseries',
                              title: 'Fill height',
                              options: {},
                              fieldConfig: {
                                defaults: {
                                  custom: {
                                    fillOpacity: 20,
                                  },
                                },
                                overrides: [],
                              },
                            }),
                          ],
                        }),
                        new SceneFlexItem({
                          children: [
                            new VizPanel({
                              pluginId: 'timeseries',
                              title: 'Fill height',
                            }),
                          ],
                        }),
                        new SceneFlexItem({
                          ySizing: 'content',
                          children: [
                            new SceneCanvasText({
                              text: 'Size to content',
                              fontSize: 20,
                              align: 'center',
                            }),
                          ],
                        }),
                        new SceneFlexItem({
                          height: 300,
                          children: [
                            new VizPanel({
                              pluginId: 'timeseries',
                              title: 'Fixed height',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new SceneFlexItem({
          xSizing: 'fill',
          children: [
            new SceneFlexLayout({
              direction: 'row',
              children: [
                new SceneFlexItem({
                  width: 50,
                  height: 50,
                  children: [new DebugItem({})],
                }),
                new SceneFlexItem({
                  xSizing: 'fill',
                  ySizing: 'fill',
                  maxHeight: 200,
                  children: [
                    new VizPanel({
                      title: 'Panel 1',
                      pluginId: 'timeseries',
                      $data: getQueryRunnerWithRandomWalkQuery(),
                    }),
                  ],
                }),
                new SceneFlexItem({
                  width: '10%',
                  ySizing: 'fill',
                  children: [new DebugItem({})],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}

class DebugItem extends SceneObjectBase<SceneObjectStatePlain> {
  public static Component = DebugItemRenderer;
}

function DebugItemRenderer() {
  const background = useMemo(() => {
    return Math.floor(Math.random() * 16777215).toString(16);
  }, []);

  return <div style={{ background: `#${background}`, width: '100%', height: '100%' }} />;
}
