import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { SceneComponentProps } from '../../core/types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneAppState } from './types';

/**
 * Responsible for top level pages routing
 */
export class SceneApp extends SceneObjectBase<SceneAppState> {
  public static Component = ({ model }: SceneComponentProps<SceneApp>) => {
    const { pages } = model.useState();

    return (
      <Switch>
        {pages.map((page) => (
          <Route
            key={page.state.url}
            exact={false}
            path={page.state.url}
            render={() => {
              return page && <page.Component model={page} />;
            }}
          ></Route>
        ))}
      </Switch>
    );
  };
}
