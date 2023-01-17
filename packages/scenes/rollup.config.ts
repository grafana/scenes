import resolve from '@rollup/plugin-node-resolve';
import path from 'path';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import { externals } from 'rollup-plugin-node-externals';

const env = process.env.NODE_ENV || 'production';
const pkg = require('./package.json');

export default [
  {
    input: 'src/index.ts',
    plugins: [
      externals({ deps: true, devDeps: true, packagePath: './package.json' }),
      resolve({ browser: true }),
      esbuild(),
    ],
    output: [
      {
        format: 'cjs',
        sourcemap: env === 'production' ? true : 'inline',
        dir: path.dirname(pkg.main),
      },
      {
        format: 'esm',
        sourcemap: env === 'production' ? true : 'inline',
        dir: path.dirname(pkg.module),
        preserveModules: true,
      },
    ],
    watch: {
      include: './src/**/*',
    },
  },
  {
    input: './compiled/index.d.ts',
    plugins: [dts()],
    output: {
      file: pkg.types,
      format: 'es',
    },
  },
];
