import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'

const config = {
  input: 'src/index.ts',
  output: {
    dir: 'esm',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.rollup.build.json',
    }),
    nodeResolve(),
  ],
}

export default config
