const path = require('path')
module.exports = {
  configureWebpack: {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@edsheet/core': path.resolve(__dirname, '../core/src'),
        '@edsheet/element-ui': path.resolve(__dirname, './src'),
        '@element-ui': path.resolve(__dirname, './src'),
      },
    }
  },
  chainWebpack: (config) => {
    // 添加 ts 和 tsx 文件的处理
    config.module
      .rule('ts')
      .test(/\.tsx?$/)
      .use('babel-loader')
      .loader('babel-loader')
      .end()
  },
}
