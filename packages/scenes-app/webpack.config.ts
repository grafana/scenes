import path from 'path';
import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';
import { getPluginId } from './.config/webpack/utils';

const config = (env: any): Configuration => {
  const pluginId = getPluginId();
  const baseConfig = grafanaConfig(env);
  return merge(baseConfig, {
    experiments: {
      asyncWebAssembly: true,
    },
    resolve: {
      // Ensure workspace packages (@grafana/scenes, @grafana/scenes-react) are
      // resolved from the monorepo root node_modules when running via turbo
      modules: [path.resolve(__dirname, '../../node_modules'), 'node_modules'],
    },
    output: {
      publicPath: `public/plugins/${pluginId}/`,
      uniqueName: pluginId,
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
  });
};

export default config;
