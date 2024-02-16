import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import { getPluginId } from './.config/webpack/utils';
import grafanaConfig from './.config/webpack/webpack.config';

const config = async (env): Promise<Configuration> => {
  const baseConfig = grafanaConfig(env);
  return merge(baseConfig, {
    experiments: {
      // Required to load WASM modules.
      asyncWebAssembly: true,
    },
    output: {
      // Required so that Grafana knows where to load the WASM module from.
      // I think ideally we'd include this in a custom rule for
      // WASM modules, but I'm not sure how to do that yet.
      publicPath: `public/plugins/${getPluginId()}/`,
    },
  });
};

export default config;
