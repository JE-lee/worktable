import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import scss from 'rollup-plugin-scss'
import copy from 'rollup-plugin-copy'

const outDir = 'esm'
const config = {
  input: 'src/index.ts',
  output: {
    dir: outDir,
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    commonjs(),
    typescript({
      tsconfig: './tsconfig.rollup.build.json',
    }),
    nodeResolve(),
    scss({ fileName: 'style.css' }),
    copy({
      targets: [{ src: 'src/style', dest: `${outDir}/theme` }],
    }),
  ],
  external: [
    'vue',
    'vue-demi',
    'element-ui',
    '@edsheet/core',
    'ag-grid-community',
    'ag-grid-vue',
    'vue-property-decorator',
  ],
}

export default config
