import { getParameters } from 'codesandbox/lib/api/define'

const CodeSandBoxHTML = '<div id="app"></div>'
const CodeSandBoxJS = `
import Vue from 'vue'
import App from './App.vue'
import Element  from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

Vue.config.productionTip = false
Vue.use(Element, { size: 'small' });

new Vue({
  render: h => h(App),
}).$mount('#app')`

const createForm = ({ method, action, data }) => {
  const form = document.createElement('form') // 构造 form
  form.style.display = 'none' // 设置为不显示
  form.target = '_blank' // 指向 iframe

  // 构造 formdata
  Object.keys(data).forEach((key) => {
    const input = document.createElement('input') // 创建 input

    input.name = key // 设置 name
    input.value = data[key] // 设置 value

    form.appendChild(input)
  })

  form.method = method // 设置方法
  form.action = action // 设置地址

  document.body.appendChild(form)

  // 对该 form 执行提交
  form.submit()

  document.body.removeChild(form)
}

export function createCodeSandBox(codeStr) {
  const parameters = getParameters({
    files: {
      'sandbox.config.json': {
        content: {
          template: 'vuepress',
          infiniteLoopProtection: true,
          hardReloadOnChange: false,
          view: 'browser',
          container: {
            port: 8080,
            node: '14',
          },
        },
      },
      'package.json': {
        content: {
          scripts: {
            serve: 'vue-cli-service serve',
            build: 'vue-cli-service build',
            lint: 'vue-cli-service lint',
          },
          dependencies: {
            '@edsheet/element-ui': 'latest',
            'core-js': '^3.6.5',
            'element-ui': 'latest',
            'vue-demi': 'latest',
            vue: '^2.7.14',
          },
          devDependencies: {
            '@vue/cli-plugin-babel': '~4.5.0',
            '@vue/cli-service': '~4.5.0',
            '@vue/composition-api': 'latest',
            'vue-template-compiler': '^2.7.14',
            "babel-eslint": "^10.0.3",
            "eslint": "^6.7.2",
            "eslint-plugin-vue": "^6.0.1",
          },
          babel: {
            presets: [
              [
                '@vue/babel-preset-jsx',
                {
                  vModel: false,
                  compositionAPI: 'vue-demi',
                },
              ],
            ],
          },
          vue: {
            devServer: {
              host: '0.0.0.0',
              disableHostCheck: true, // 必须
            },
          },
          eslintConfig: {
            root: true,
            env: {
              browser: true
            },
            extends: [
              'plugin:vue/essential',
              'eslint:recommended'
            ],
            rules: {},
            parserOptions: {
              parser: 'babel-eslint'
            }
          },
        },
      },
      'src/App.vue': {
        content: codeStr,
      },
      'src/main.js': {
        content: CodeSandBoxJS,
      },
      'public/index.html': {
        content: CodeSandBoxHTML,
      },
    },
  })

  createForm({
    method: 'post',
    action: 'https://codesandbox.io/api/v1/sandboxes/define',
    data: {
      parameters,
      query: 'file=/src/App.vue',
    },
  })
}
