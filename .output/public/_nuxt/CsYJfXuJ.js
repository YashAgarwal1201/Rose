import{s as a}from"./CyUFF4Rk.js";import{a3 as r,as as e,y as n,z as s,al as i,am as p}from"./PtNISsP7.js";var u=`
    .p-radiobutton-group {
        display: inline-flex;
    }
`,d={root:"p-radiobutton-group p-component"},m=r.extend({name:"radiobuttongroup",style:u,classes:d}),l={name:"BaseRadioButtonGroup",extends:a,style:m,provide:function(){return{$pcRadioButtonGroup:this,$parentInstance:this}}},c={name:"RadioButtonGroup",extends:l,inheritAttrs:!1,data:function(){return{groupName:this.name}},watch:{name:function(o){this.groupName=o||e("radiobutton-group-")}},mounted:function(){this.groupName=this.groupName||e("radiobutton-group-")}};function f(t,o,g,h,$,v){return s(),n("div",p({class:t.cx("root")},t.ptmi("root")),[i(t.$slots,"default")],16)}c.render=f;export{c as default};
