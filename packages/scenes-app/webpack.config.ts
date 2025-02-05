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
