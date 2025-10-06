import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';
import { getPluginId } from './.config/webpack/utils';
import path from 'path';

const config = (env: any): Configuration => {
  const pluginId = getPluginId();
  const baseConfig = grafanaConfig(env);
  return merge(baseConfig, {
    experiments: {
      asyncWebAssembly: true,
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
    resolve: {
      alias: {
        '@grafana/scenes$': env?.production
          ? path.resolve(__dirname, '../scenes/dist/esm')
          : path.resolve(__dirname, '../scenes/src'),
        '@grafana/scenes/src': path.resolve(__dirname, '../scenes/src'),
        '@grafana/scenes-react$': env?.production
          ? path.resolve(__dirname, '../scenes-react/dist/esm')
          : path.resolve(__dirname, '../scenes-react/src'),
        '@grafana/scenes-react/src': path.resolve(__dirname, '../scenes-react/src'),
      },
    },
  });
};

export default config;
