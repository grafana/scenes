import path from 'path';
import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';
import { getPluginId } from './.config/webpack/utils';

// Workspace root node_modules (where yarn hoists @grafana/scenes and @grafana/scenes-react)
const workspaceRoot = path.resolve(__dirname, '../..');

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
    resolve: {
      modules: [
        path.join(workspaceRoot, 'node_modules'),
        path.join(__dirname, 'node_modules'),
        'node_modules',
      ],
      fallback: {
        fs: false,
        'fs/promises': false,
        path: false,
      },
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
