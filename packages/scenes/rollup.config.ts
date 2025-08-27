import { defineConfig } from 'rollup';
import { createRequire } from 'node:module';
import resolve from '@rollup/plugin-node-resolve';
import path from 'path';
import dts from 'rollup-plugin-dts';
import json from '@rollup/plugin-json';
import esbuild from 'rollup-plugin-esbuild';
import eslint from '@rollup/plugin-eslint';
import { nodeExternals } from 'rollup-plugin-node-externals';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
const env = process.env.NODE_ENV || 'production';
const rq = createRequire(import.meta.url);

const pkg = rq('./package.json');

const plugins = [
  nodeExternals({ deps: true, devDeps: true, packagePath: './package.json' }),
  resolve({ browser: true }),
  esbuild({
    target: 'es2018',
    tsconfig: './tsconfig.json',
    jsx: 'automatic',
  }),
  eslint(),
  json(),
  dynamicImportVars(),
];

const config = defineConfig([
  {
    input: 'src/index.ts',
    plugins: env === 'development' ? [...plugins] : plugins,
    output: [
      {
        format: 'cjs',
        sourcemap: env === 'production' ? true : 'inline',
        dir: path.dirname(pkg.main),
        esModule: true,
        interop: 'compat',
      },
      {
        format: 'esm',
        sourcemap: env === 'production' ? true : 'inline',
        dir: path.dirname(pkg.module),
        preserveModules: true,
      },
    ],
    watch: {
      include: 'src/**/*',
    },
  },
]);

if (process.env.NODE_ENV !== 'development') {
  config.push({
    input: 'src/index.ts',
    plugins: [dts()],
    output: {
      file: './dist/index.d.ts',
      format: 'es',
    },
  });
}

export default config;
