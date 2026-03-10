import { createRequire } from 'node:module';
import nodeResolve from '@rollup/plugin-node-resolve';
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
const projectCwd = process.env.PROJECT_CWD ?? '../../';

const plugins = [
  nodeExternals({ deps: true, devDeps: true, packagePath: './package.json' }),
  nodeResolve({ browser: true }),
  esbuild({
    target: 'es2018',
    tsconfig: './tsconfig.json',
  }),
  eslint(),
  json(),
  dynamicImportVars(),
];

export default [
  {
    input: 'src/index.ts',
    treeshake: env === 'development' ? false : true,
    plugins,
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
        preserveModulesRoot: path.resolve(projectCwd, 'packages/scenes/src'),
      },
    ],
    watch: {
      include: 'src/**/*',
    },
  },
  {
    input: 'src/index.ts',
    plugins: [dts()],
    output: {
      file: './dist/index.d.ts',
      format: 'es',
    },
  },
];
