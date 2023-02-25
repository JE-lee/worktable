import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

// TODO: pack style.scss
const config = {
  input: 'src/index.ts',
  output: {
    dir: 'esm',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    commonjs(),
    typescript({
      tsconfig: './tsconfig.rollup.build.json',
    }),
    nodeResolve(),
  ],
  external: ['vue', 'vue-demi', 'element-ui'],
}

export default config
