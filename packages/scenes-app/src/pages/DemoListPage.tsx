import {
  EmbeddedScene,
  SceneApp,
  SceneAppPage,
  SceneFlexLayout,
  SceneFlexItem,
  SceneReactObject,
  useSceneApp,
  SceneObjectState,
  SceneObjectBase,
  SceneComponentProps,
  SceneCSSGridLayout,
  SceneObject,
} from '@grafana/scenes';
import React from 'react';
import { demoUrl, prefixRoute } from '../utils/utils.routing';
import { DATASOURCE_REF, ROUTES } from '../constants';
import { getDemos } from '../demos';
import { Alert, Card, Input, useStyles2 } from '@grafana/ui';
import { config } from '@grafana/runtime';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

function getDemoSceneApp() {
  return new SceneApp({
    name: 'scenes-demos-app',
    pages: [
      new SceneAppPage({
        title: 'Demos',
        key: 'SceneAppPage Demos',
        url: prefixRoute(ROUTES.Demos),
        getScene: () => {
          return new EmbeddedScene({
            key: 'Demos EmbeddedScene',
            body: new DemoList(),
          });
        },
        drilldowns: [
          {
            routePath: `${demoUrl(':demo')}`,
            getPage: (routeMatch, parent) => {
              const demos = getDemos();
              const demoSlug = decodeURIComponent(routeMatch.params.demo);
              const demoInfo = demos.find((x) => slugify(x.title) === demoSlug);

              if (!demoInfo) {
                return getDemoNotFoundPage(routeMatch.url);
              }

              return demoInfo.getPage({
                title: demoInfo.title,
                url: `${demoUrl(slugify(demoInfo.title))}`,
                getParentPage: () => parent,
              });
            },
          },
        ],
      }),
    ],
  });
}

export const DemoListPage = () => {
  const scene = useSceneApp(getDemoSceneApp);
  return <scene.Component model={scene} />;
};

export interface DemoListState extends SceneObjectState {
  body: SceneCSSGridLayout;
  searchQuery: string;
}

export class DemoList extends SceneObjectBase<DemoListState> {
  constructor() {
    super({
      body: new SceneCSSGridLayout({
        children: [],
        templateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        autoRows: 'unset',
      }),
      searchQuery: '',
    });

    this.addActivationHandler(() => this.updateLayout());
  }

  private updateLayout() {
    const { searchQuery, body } = this.state;
    const children: SceneObject[] = [];
    const regex = new RegExp(searchQuery, 'i');

    for (const demo of getDemos()) {
      if (searchQuery) {
        if (!demo.title.match(regex)) {
          continue;
        }
      }

      children.push(
        new SceneReactObject({
          reactNode: (
            <Card key={demo.title} href={demoUrl(slugify(demo.title))}>
              <Card.Heading>{demo.title}</Card.Heading>
            </Card>
          ),
        })
      );
    }

    body.setState({ children });
  }

  public onSearchChange = (evt: React.FormEvent<HTMLInputElement>) => {
    this.setState({ searchQuery: evt.currentTarget.value });
    this.updateLayout();
  };

  public static Component = ({ model }: SceneComponentProps<DemoList>) => {
    const { body, searchQuery } = model.useState();
    const styles = useStyles2(getStyles);

    if (!config.datasources[DATASOURCE_REF.uid]) {
      return (
        <Alert title={`Missing ${DATASOURCE_REF.uid} datasource`}>
          These demos depend on <b>testdata</b> datasource: <code>{JSON.stringify(DATASOURCE_REF)}</code>. See{' '}
          <a href="https://github.com/grafana/grafana/tree/main/devenv#set-up-your-development-environment">
            https://github.com/grafana/grafana/tree/main/devenv#set-up-your-development-environment
          </a>{' '}
          for more details.
        </Alert>
      );
    }

    return (
      <div className={styles.root}>
        <Input value={searchQuery} placeholder="Search" onChange={model.onSearchChange} />
        <body.Component model={body} />
      </div>
    );
  };
}

function slugify(title: string) {
  const simplified = title
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '');

  return encodeURIComponent(simplified);
}

export function getDemoNotFoundPage(url: string): SceneAppPage {
  return new SceneAppPage({
    title: 'Demo not found',
    subTitle: 'So sorry sir but the demo cannot be found.',
    url: url,
    getScene: () => {
      return new EmbeddedScene({
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new SceneReactObject({
                component: () => {
                  return <div style={{ fontSize: 50 }}>😭</div>;
                },
              }),
            }),
          ],
        }),
      });
    },
  });
}

const getStyles = (theme: GrafanaTheme2) => ({
  root: css({
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'column',
    alignSelf: 'baseline',
    gap: theme.spacing(2),
  }),
});
