import React, { useMemo } from 'react';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneComponentProps,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObject,
  SceneObjectBase,
  SceneObjectState,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
  UrlSyncContextProvider,
} from '@grafana/scenes';
import { Drawer } from '@grafana/ui';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getDrawerDrilldownDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Open a sub scene in a drawer',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Dynamic options demo',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new PanelWithDrawer({
                body: getRoomsTemperatureTable(),
              }),
            }),
          ],
        }),
      });
    },
  });
}

export function getRoomsTemperatureTable() {
  const dataTransformed = new SceneDataTransformer({
    $data: getQueryRunnerWithRandomWalkQuery(
      { seriesCount: 10, spread: 15, alias: '__house_locations' },
      { maxDataPoints: 50 }
    ),
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
    .setData(dataTransformed)
    .setTitle('Room temperature overview')
    .setOption('sortBy', [
      {
        displayName: 'Average temperature',
      },
    ])
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Average temperature')
        .overrideUnit('celsius')
        .overrideCustomFieldConfig('align', 'center')
        .matchFieldsWithName('Room')
        .overrideLinks([
          {
            title: 'Go to room overview',
            url: '${__url.path}${__url.params:exclude:room}&room=${__value.text}',
          },
        ])
        .overrideCustomFieldConfig('width', 250)
    )
    .build();
}

interface PanelWithDrawerState extends SceneObjectState {
  room?: string;
  body: SceneObject;
}

class PanelWithDrawer extends SceneObjectBase<PanelWithDrawerState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['room'] });

  public constructor(state: PanelWithDrawerState) {
    super(state);
  }

  public getUrlState() {
    return { room: this.state.room };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    if (typeof values.room === 'string') {
      this.setState({ room: values.room });
    } else if (values.room == null) {
      this.setState({ room: undefined });
    }
  }

  static Component = ({ model }: SceneComponentProps<PanelWithDrawer>) => {
    const { room, body } = model.useState();

    return (
      <>
        <body.Component model={body} />
        {room && (
          <Drawer title={`${room} details`} onClose={() => model.setState({ room: undefined })}>
            <DrilldownScene room={room} />
          </Drawer>
        )}
      </>
    );
  };
}

interface DrilldownSceneProps {
  room: string;
}

function DrilldownScene(props: DrilldownSceneProps) {
  const scene = useMemo(() => getDrilldownScene(props.room), [props.room]);

  return (
    <UrlSyncContextProvider scene={scene}>
      <scene.Component model={scene} />
    </UrlSyncContextProvider>
  );
}

export function getDrilldownScene(room: string) {
  return new EmbeddedScene({
    $data: getQueryRunnerWithRandomWalkQuery({ seriesCount: 3, spread: 15 }, { maxDataPoints: 50 }),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: 500,
          body: PanelBuilders.timeseries().setTitle(room).setUnit('humidity').build(),
        }),
      ],
    }),
    ...getEmbeddedSceneDefaults(),
  });
}
