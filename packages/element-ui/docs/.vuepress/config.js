const path = require('path')
const utils = require('./util')

const base = '/worktable/element-ui/'

const features = utils
.getFiles(path.resolve(__dirname, '../feature'))
.map((item) => item.replace(/(\.md)/g, ''))
.filter((item) => item !== 'index')
.sort((a,b) => parseInt(a) - parseInt(b))

const api = utils
.getFiles(path.resolve(__dirname, '../api'))
.map((item) => item.replace(/(\.md)/g, ''))
.filter((item) => item !== 'index')
.sort((a,b) => parseInt(a) - parseInt(b))

module.exports = {
  base,
  title: 'Worktable',
  description: 'Editable table, Supported vue and react',
  theme: '@vuepress-dumi/dumi',
  themeConfig: {
    repo: 'https://github.com/JE-lee/worktable',
    nav: [
      { text: 'Home', link: '/' },
      { text: '指南', link: '/guide/install' },
      { text: '特性', link: '/feature/0inner-component' },
      { text: 'API', link: '/api/0Column' },
    ],
    sidebar: {
      '/guide/': ['install', 'base-usage'],
      '/feature/': [...features],
      '/api/': [...api]
    }
  },
  plugins: [
    '@vuepress-dumi/dumi-previewer'
  ],
  configureWebpack: {
    output: {
      publicPath: base,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@edsheet/core': path.resolve(__dirname, '../../../core/src'),
        '@edsheet/element-ui': path.resolve(__dirname, '../../src'),
        '@element-ui': path.resolve(__dirname, '../../src'),
        // fix: 统一 vue-demi 和 vue-press 的 vue 依赖位置
        'vue': path.resolve(__dirname, '../../node_modules/vue/dist/vue.runtime.esm.js'),
      },
    },
    module: {
      rules: [{
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          'cache-loader',
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              configFile: path.resolve(__dirname, '../../babel.config.js')
            }
          }
        ]
      }]
    }
  },
  dest: path.resolve(__dirname, '../../../../docs-site/element-ui')
}
