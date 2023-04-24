module.exports = {
  configureWebpack: {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
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
