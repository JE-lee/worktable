// eslint-disable-next-line no-undef
module.exports = {
  presets: [
    ['@babel/preset-env'],
    ['@babel/preset-typescript']
  ],
  plugins: [
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
  ],
}
