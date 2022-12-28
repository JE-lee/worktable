const path = require('path')

module.exports = {
  title: 'Worktable',
  description: 'editbale table, supported vue and react',
  configureWebpack: {
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@worktable/element-ui': path.resolve(__dirname, '../../src'),
        '@': path.resolve(__dirname, '../../src'),
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
          'babel-loader'
        ]
      }]
    }
  }

}
