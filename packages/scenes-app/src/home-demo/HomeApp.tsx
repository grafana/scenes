import React from 'react';
import { Card, useStyles2 } from '@grafana/ui';
import { prefixRoute } from '../utils/utils.routing';
import { ROUTES } from '../constants';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { css } from '@emotion/css';
import { PluginPage, locationService } from '@grafana/runtime';

function getStyles(theme: GrafanaTheme2) {
  return {
    content: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      padding: theme.spacing(2),
    }),
    title: css({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing(10),
    }),
    cardsRow: css({
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(2),
    }),
  };
}

const history = locationService.getHistory();

export const HomePage = () => {
  const styles = useStyles2(getStyles);

  return (
    <PluginPage layout={PageLayoutType.Custom}>
      <div className={styles.content}>
        <div className={styles.title}>
          <h1>Learn how to build apps with Scenes</h1>
        </div>
        <div className={styles.cardsRow}>
          <Card key={`card-demo`} onClick={() => history.push(prefixRoute(`${ROUTES.Demos}`))}>
            <Card.Heading>Demo</Card.Heading>
            <Card.Description>
              <p>List of scenes demo</p>
            </Card.Description>
          </Card>
          <Card
            key={`card-grafana-monitoring`}
            onClick={() => history.push(prefixRoute(`${ROUTES.GrafanaMonitoring}`))}
          >
            <Card.Heading>Grafana Monitoring</Card.Heading>
            <Card.Description>
              <p>A custom app with embedded scenes to monitor your Grafana server</p>
            </Card.Description>
          </Card>
          <Card key={`card-react-demo`} onClick={() => history.push(prefixRoute(`${ROUTES.ReactDemo}`))}>
            <Card.Heading>React only demo</Card.Heading>
            <Card.Description>
              <p>Welcome to the React first demos</p>
            </Card.Description>
          </Card>
        </div>
      </div>
    </PluginPage>
  );
};
