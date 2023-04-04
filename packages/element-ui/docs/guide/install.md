# 安装

## vue <= 2.6.x
```bash
pnpm add @edsheet/element-ui @vue/composition-api vue-demi element-ui
# 或者
npm instasll @edsheet/element-ui @vue/composition-api vue-demi element-ui
```
**注意：** 需要注册`@vue/composition-api`
```javascript
import VueCompositionApi from '@vue/composition-api'
import Vue from 'vue'
Vue.use(VueCompositionApi)
```

## vue >= 2.7.0
```bash
pnpm add @edsheet/element-ui element-ui vue-demi
# 或者
npm install @edsheet/element-ui element-ui vue-demi
