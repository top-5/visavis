import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import dts from 'rollup-plugin-dts';
import babel from '@rollup/plugin-babel';

const packageJson = require('./package.json');

export default [
  {
    input: 'src/library.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      peerDepsExternal(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        exclude: [
          '**/__tests__',
          '**/__snapshots__',
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.stories.tsx',
          '**/setupTests.ts',
          'src/App/*',
          'src/index.tsx'
        ]
      }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
      resolve({ preferBuiltins: false, extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'] }),
      postcss()
    ],
    external: ['react', 'react-dom', 'three', '@react-three/drei', '@react-three/fiber', '@react-three/rapier']
  },
  {
    input: 'src/ext/library.ts',
    output: [
      {
        file: `public/ext/${packageJson.ext}`,
        format: 'cjs',
        sourcemap: true
      },
      {
        file: `public/ext/${packageJson.extmodule}`,
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      peerDepsExternal(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        exclude: [
          '**/__tests__',
          '**/__snapshots__',
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.stories.tsx',
          '**/setupTests.ts',
          'src/App/*',
          'src/index.tsx'
        ]
      }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
      resolve({ preferBuiltins: false, extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'] }),
      postcss()
    ],
    external: ['react', 'react-dom', 'three', '@react-three/drei', '@react-three/fiber', '@react-three/rapier']
  },
  {
    input: './dist/src/library.d.ts',
    output: [{ file: 'dist/types.d.ts', format: 'es', paths: { 'src/types': './src/types' } }],
    plugins: [dts()]
  }
];
