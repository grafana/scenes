import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { DataRequestEnricher, SceneComponentProps, SceneObject } from '../../core/types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneAppState } from './types';
import { renderSceneComponentWithRouteProps } from './utils';
import { DataQueryRequest } from '@grafana/data';

/**
 * Responsible for top level pages routing
 */
export class SceneApp extends SceneObjectBase<SceneAppState> implements DataRequestEnricher {
  public enrichDataRequest(source: SceneObject, request: DataQueryRequest): DataQueryRequest {
    if (this.state.dataRequestEnricher) {
      return this.state.dataRequestEnricher(source, request);
    }

    return request;
  }

  public static Component = ({ model }: SceneComponentProps<SceneApp>) => {
    const { pages } = model.useState();

    return (
      <Switch>
        {pages.map((page) => (
          <Route
            key={page.state.url}
            exact={false}
            path={page.state.url}
            render={(props) => renderSceneComponentWithRouteProps(page, props)}
          ></Route>
        ))}
      </Switch>
    );
  };
}
