(window.webpackJsonp=window.webpackJsonp||[]).push([[51],{437:function(n,e,t){"use strict";t.r(e),e.default="<template>\n  <div>\n    <div>\n      <el-button type=\"primary\" size=\"mini\" @click=\"doValidate\">校验</el-button>\n      <el-button type=\"primary\" size=\"mini\" @click=\"doSubmit\">提交</el-button>\n    </div>\n    <worktable class=\"mt-10\" border />\n  </div>\n</template>\n\n<script>\nimport { defineComponent } from 'vue-demi'\nimport { useWorktable, Worktable } from '@edsheet/element-ui'\nimport { toys } from '../const'\n\nexport default defineComponent({\n  components: { Worktable },\n  setup() {\n    const columns = [\n      {\n        title: '名称',\n        field: 'name',\n        type: 'string',\n        component: 'Input',\n      },\n      {\n        title: '性别',\n        field: 'gender',\n        type: 'string',\n        width: 200,\n        component: 'Select',\n        enum: [\n          { label: '男孩', value: 'boy' },\n          { label: '女孩', value: 'girl' },\n        ],\n      },\n      {\n        title: '喜欢的玩具',\n        field: 'toy',\n        width: 200,\n        // 渲染的组件是动态的，根据性别的不同来渲染不同的组件\n        component: (row) => (row.data.gender === 'boy' ? 'Select' : 'Input'),\n        // 组件属性也是动态的\n        componentProps: (row) => {\n          return {\n            placeholder: row.data.gender === 'boy' ? '请选择' : '请输入',\n          }\n        },\n        enum: toys,\n      },\n    ]\n    const worktable = useWorktable({\n      initialData: [{ name: '琪琪', gender: 'girl' }],\n      columns,\n    })\n    function doValidate() {\n      worktable\n        .validate()\n        .then(() => {\n          console.log('validate successed')\n        })\n        .catch((err) => {\n          console.error(err)\n        })\n    }\n    async function doSubmit() {\n      await worktable.validate()\n      const data = worktable.getData()\n      console.log('data', data)\n    }\n\n    return {\n      doValidate,\n      doSubmit,\n    }\n  },\n})\n<\/script>\n"}}]);