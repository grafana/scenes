import { EmbeddedScene, SceneFlexItem, SceneFlexLayout, VizPanel, VizPanelMenu } from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from '../utils';

export function getPanelMenuTest() {
  const data = getQueryRunnerWithRandomWalkQuery();
  const menuItems = [
    {
      text: 'Item 1',
      onClick: () => {
        alert('Item 1 clicked');
      },
    },
    {
      text: 'Item 2',
      onClick: () => {
        alert('Item 2 clicked');
      },
    },
  ];
  const lazyMenu = new VizPanelMenu({});
  lazyMenu.addActivationHandler(() => {
    setTimeout(() => {
      lazyMenu.setItems(menuItems);
    }, 1000);
  });

  const staticMenu = new VizPanelMenu({
    items: menuItems,
  });

  const staticMenuViaActivation = new VizPanelMenu({});
  staticMenuViaActivation.addActivationHandler(() => {
    staticMenuViaActivation.setItems(menuItems);
  });

  const dynamicMenu = new VizPanelMenu({});
  let ctr = 1;
  dynamicMenu.addActivationHandler(() => {
    setTimeout(() => {
      const message = `Item ${ctr} clicked`;
      dynamicMenu.addItem({
        text: `Item ${ctr}`,
        onClick: () => {
          alert(message);
        },
      });
      ctr++;
    }, 500);
  });

  const readingFromPanelMenu = new VizPanelMenu({});
  const panelWithMenu = new VizPanel({
    title: 'Menu reading from panel state',
    pluginId: 'timeseries',
    placement: {
      minHeight: 200,
      minWidth: '40%',
    },
    menu: readingFromPanelMenu,
  });

  readingFromPanelMenu.addActivationHandler(() => {
    const plugin = panelWithMenu.getPlugin();

    readingFromPanelMenu.setItems([
      {
        text: `Alert plugin type`,
        onClick: () => {
          alert(plugin?.meta.id);
        },
      },
      {
        text: `Change ${plugin?.meta.id} panel title`,
        onClick: () => {
          panelWithMenu.setState({ title: `Updated title ${Math.floor(Math.random() * 100) + 1}` });
        },
      },
      {
        text: `Change number of  series`,
        onClick: () => {
          data.setState({
            queries: [
              {
                ...data.state.queries[0],
                seriesCount: Math.floor(Math.random() * 10) + 1,
              },
            ],
          });
          data.runQueries();
        },
      },
    ]);
  });

  return new EmbeddedScene({
    body: new SceneFlexLayout({
      $data: data,
      direction: 'row',
      wrap: 'wrap',
      children: [
        new SceneFlexItem({
          flexGrow: 1,
          minHeight: 200,
          minWidth: '40%',
          children: [
            new VizPanel({
              title: 'Basic static menu',
              pluginId: 'timeseries',

              menu: staticMenu,
            }),
          ],
        }),
        new SceneFlexItem({
          flexGrow: 1,
          minHeight: 200,
          minWidth: '40%',
          children: [
            new VizPanel({
              title: 'Basic lazy menu',
              pluginId: 'timeseries',
              placement: {
                minHeight: 200,
                minWidth: '40%',
              },

              menu: staticMenuViaActivation,
            }),
          ],
        }),
        new SceneFlexItem({
          flexGrow: 1,
          minHeight: 200,
          minWidth: '40%',
          children: [
            new VizPanel({
              title: 'Async menu, will show after 1s',
              pluginId: 'timeseries',
              placement: {
                minHeight: 200,
                minWidth: '40%',
              },

              menu: lazyMenu,
            }),
          ],
        }),
        new SceneFlexItem({
          flexGrow: 1,
          minHeight: 200,
          minWidth: '40%',
          children: [
            new VizPanel({
              title: 'New item added to menu after it is shown',
              pluginId: 'timeseries',
              placement: {
                minHeight: 200,
                minWidth: '40%',
              },

              menu: dynamicMenu,
            }),
          ],
        }),
        new SceneFlexItem({
          flexGrow: 1,
          minHeight: 200,
          minWidth: '40%',
          children: [panelWithMenu],
        }),
      ],
    }),
  });
}
