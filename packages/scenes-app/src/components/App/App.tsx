import * as React from 'react';
import { AppRootProps } from '@grafana/data';
import { PluginPropsContext } from '../../utils/utils.plugin';
import { AppRoutes } from '../Routes';

export class App extends React.PureComponent<AppRootProps> {
  render() {
    return (
      <PluginPropsContext.Provider value={this.props}>
        <AppRoutes />
      </PluginPropsContext.Provider>
    );
  }
}
