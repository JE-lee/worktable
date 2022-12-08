/* eslint-disable no-undef */
import { rollup } from 'rollup'
import config from '../rollup.config.mjs'
import { relative } from 'node:path'

const input = process.argv[2]

if (!input) {
  console.error('no entry')
  process.exit(1)
}

// see below for details on these options
const rollupConfig = config
// TODO: rollup 的问题
// npx rollup --config rollup.debug.config.js --bundleConfigAsCjs -i ${file}
// 如果是绝对路径，有可能无法识别 typescript， 转换成相对路径后就没问题
const entry = relative(process.cwd(), input)
rollupConfig.input = entry

const outputOption = {
  dir: 'debug',
  sourcemap: true,
  format: 'cjs',
}

build()

async function build() {
  let bundle
  let buildFailed = false

  try {
    // create a bundle
    bundle = await rollup(rollupConfig)

    await bundle.write(outputOption)
  } catch (error) {
    buildFailed = true
    console.error('build error:', error)
  }
  if (bundle) {
    // closes the bundle
    await bundle.close()
  }
  process.exit(buildFailed ? 1 : 0)
}
