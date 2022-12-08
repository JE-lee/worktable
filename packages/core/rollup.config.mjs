import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'

const config = {
  input: 'src/index.ts',
  output: {
    dir: 'output',
    format: 'es',
    sourcemap: true,
  },
  plugins: [typescript(), nodeResolve()],
}

export default config
