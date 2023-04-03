const path = require('path')

// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'prettier/prettier': 'error',
    'no-debugger': 'warn',
  },
  globals: {
    process: 'readonly',
  },
  overrides: [{
    files: ['docs/**/*'],
    parserOptions: {
      parser: '@babel/eslint-parser',
      babelOptions: {
        configFile: path.resolve(__dirname, '../element-ui/babel.config.js')
      }
    },
    extends: [
      'plugin:prettier/recommended',
      'plugin:vue/essential',
      'eslint:recommended',
    ],
    plugins: ['vue', '@typescript-eslint'],
    rules: {
      'prettier/prettier': 'error',
      'no-debugger': 'warn',
      'vue/multi-word-component-names': 'off'
    },
  }],
}
