(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{359:function(e,l,a){"use strict";a.d(l,"a",(function(){return t}));const t=[{label:"小汽车",value:"Toy cars"},{label:"电动火车",value:"Electric trains"},{label:"塑料兵人",value:"Plastic soldiers"},{label:"玩具飞机",value:"Toy airplanes"},{label:"模型飞机",value:"Model airplanes"},{label:"建筑积木",value:"Building blocks"},{label:"魔方",value:"Rubik's cube"},{label:"飞镖",value:"Darts"},{label:"弹弓",value:"Slingshots"},{label:"遥控车",value:"Remote control cars"},{label:"遥控飞机",value:"Remote control airplanes"},{label:"童年科学玩具",value:"Science toys for kids"},{label:"外星人玩具",value:"Alien toys"},{label:"模型坦克",value:"Model tanks"},{label:"火车轨道",value:"Train tracks"},{label:"卡片收集游戏",value:"Trading card games"},{label:"电子游戏机",value:"Video game consoles"},{label:"骑自行车",value:"Riding bicycles"},{label:"溜滑板",value:"Skateboarding"},{label:"水枪",value:"Water guns"}]},448:function(e,l,a){"use strict";a.r(l);var t=a(322),n=a(327),i=a(359),o=Object(t.b)({components:{Worktable:n.a},setup(){const e=[{title:"名称",field:"name",type:"string",component:"Input"},{title:"性别",field:"gender",type:"string",width:200,component:"Select",enum:[{label:"男孩",value:"boy"},{label:"女孩",value:"girl"}]},{title:"喜欢的玩具",field:"toy",width:200,component:e=>"boy"===e.data.gender?"Select":"Input",componentProps:e=>({placeholder:"boy"===e.data.gender?"请选择":"请输入"}),enum:i.a}],l=Object(n.b)({initialData:[{name:"琪琪",gender:"girl"}],columns:e});return{doValidate:function(){l.validate().then(()=>{console.log("validate successed")}).catch(e=>{console.error(e)})},doSubmit:async function(){await l.validate();const e=l.getData();console.log("data",e)}}}}),s=a(14),c=Object(s.a)(o,(function(){var e=this._self._c;this._self._setupProxy;return e("div",[e("div",[e("el-button",{attrs:{type:"primary",size:"mini"},on:{click:this.doValidate}},[this._v("校验")]),this._v(" "),e("el-button",{attrs:{type:"primary",size:"mini"},on:{click:this.doSubmit}},[this._v("提交")])],1),this._v(" "),e("worktable",{staticClass:"mt-10",attrs:{border:""}})],1)}),[],!1,null,null,null);l.default=c.exports}}]);