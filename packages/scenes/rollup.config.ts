import { createRequire } from 'node:module';
import resolve from '@rollup/plugin-node-resolve';
import path from 'path';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import eslint from '@rollup/plugin-eslint';
import { nodeExternals } from 'rollup-plugin-node-externals';
const env = process.env.NODE_ENV || 'production';
const rq = createRequire(import.meta.url);

const pkg = rq('./package.json');

const plugins = [
  nodeExternals({ deps: true, devDeps: true, packagePath: './package.json' }),
  resolve({ browser: true }),
  esbuild({
    target: 'es2018',
    tsconfig: './tsconfig.json',
    sourceMap: true,
    minify: false,
  }),
  eslint(),
];

export default [
  {
    input: 'src/index.ts',
    plugins: env === 'development' ? [...plugins] : plugins,
    output: [
      {
        format: 'cjs',
        sourcemap: {
          filename: 'src/index.ts',
          sourcesContent: true
        },
        dir: path.dirname(pkg.main),
        esModule: true,
        interop: 'compat',
        sourcemapPathTransform: (relativeSourcePath) => {
          return path.resolve(__dirname, relativeSourcePath);
        },
      },
      {
        format: 'esm',
        sourcemap: {
          filename: 'src/index.ts',
          sourcesContent: true
        },
        dir: path.dirname(pkg.module),
        preserveModules: true,
        sourcemapPathTransform: (relativeSourcePath) => {
          return path.resolve(__dirname, relativeSourcePath);
        },
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
