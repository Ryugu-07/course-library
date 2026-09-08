(function(root,factory){
 "use strict";const lib=factory(typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab);
 if(typeof module==="object"&&module.exports)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-derived-category",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
 "use strict";
 const mod=(a,m)=>((a%m)+m)%m;
 function roof(n,m,a){
  if(![n,m,a].every(Number.isInteger)||n<2||n>12||m<2||m>12||a<0||a>12)throw Error("要求2≤n,m≤12，0≤a≤12且为整数");
  a=mod(a,m);const elements=Array.from({length:m},(_,i)=>i),d=elements.map(x=>mod(-n*x,m)),kernel=elements.filter(x=>d[x]===0),image=[...new Set(d)].sort((x,y)=>x-y),cosets=[];
  for(const x of elements)if(!cosets.some(c=>c.includes(x)))cosets.push([...new Set(image.map(y=>mod(x+y,m)))].sort((x,y)=>x-y));
  const equivalent=cosets.find(c=>c.includes(a)),witness=elements.filter(h=>mod(n*h,m)===a),classIndex=cosets.indexOf(equivalent);
  let order=1;while(!image.includes(mod(order*a,m)))order++;
  return {n,m,a,d,kernel,image,cosets,equivalent,witness,classIndex,order,isZero:image.includes(a)};
 }
 function cone(sign,p){
  if(![-1,1].includes(sign)||![0,2,3,5].includes(p))throw Error("符号为±1，底域为Q或F₂/F₃/F₅");
  const reduce=x=>p?mod(x,p):x,d1=[1,reduce(sign)],d2=[1,1],square=reduce(d1[0]+d1[1]),isComplex=square===0;
  return {sign,p,d1,d2,square,isComplex,homology:isComplex?[0,0,0]:null};
 }
 const list=a=>'{'+a.join(', ')+'}';
 const configs={roofs:{title:"改变代表元，是否真的改变了导出态射？",predict:"先预测n=6,m=4时：a=1与a=3是两支不同链映射，为什么能表示同一个Ext类？a=2呢？",
  scope:"M=Z/n，N=Z/m，P=[Z→ⁿZ]在次数−1,0。程序精确枚举有限群，不把Z/n→Z的无限群结论伪装成有限搜索。层级的可逆性由正文证明。",
  controls:[["n","分解的整数 n",2,12,1,6],["m","目标群模数 m",2,12,1,4],["a","右腿 fₐ(1) 的整数代表 a",0,12,1,1],["layer","层级 0=C / 1=K / 2=D",0,2,1,2]],
  compute(v){const r=roof(v.n,v.m,v.a);return {numeric:r,rows:[["当前层",['C(Z)：严格链映射','K(Z)：链映射模链同伦','D(Z)：再求逆拟同构'][v.layer]],["增广 ε:P→Z/n 可逆？",v.layer===2?'是；逆由 M ←ε P →id P 表示':'否；Z/n→Z 只能是零映射'],["a在Z/m中的值",r.a],["Hom微分 −n 的逐元素输出",list(r.d)],["Hom = ker(−n)",list(r.kernel)],["im(−n)",list(r.image)],["Ext¹ 的所有陪集",r.cosets.map(list).join('；')],["与当前右腿同伦的全部代表",list(r.equivalent)],["当前Ext类",r.isZero?'零类':'非零类，阶 '+r.order],["若为零类，a=n h 的同伦见证 h",r.witness.length?list(r.witness):'不存在']],
   chart:{title:"Hom微分的有限群作用表",xlabel:"输入 b∈Z/m",ylabel:"−n b mod m",series:[{label:"精确枚举的离散元素",points:r.d.map((y,x)=>[x,y]),dots:true}]},
   text:"表中Ext计算始终指D(Z)里的roof类；选择C或K不会改变算术，只改变ε是否可逆。代表元a先模m，a与b同类恰当且仅当a−b∈nN。零类见证明确给出fₐ=d h+h d的h；这比只报gcd(n,m)更能看见链同伦做了什么。"};}},
  cones:{title:"去掉一个负号，甚至可能不再是复形",predict:"先预测：Q上把(x,−x)改成(x,x)后，连续做两次微分得到什么？为什么F₂抓不住这个错误？",
   scope:"C=[k→¹k]，取Cone(id_C)，次数−2,−1,0的维数1,2,1。底域只能是Q、F₂、F₃、F₅；非复形时不输出同调维数。",
   controls:[["wrong","符号 0=标准负号 / 1=错误正号",0,1,1,0],["field","底域 0=Q / 1=F₂ / 2=F₃ / 3=F₅",0,3,1,0]],
   compute(v){const r=cone(v.wrong?1:-1,[0,2,3,5][v.field]);return {numeric:r,rows:[["底域",r.p?'F'+r.p:'Q'],["d⁻²(1)",`(${r.d1.join(', ')})`],["d⁻¹(y,z)",'y+z'],["d⁻¹d⁻²(1)",r.square],["是否为复形",r.isComplex?'是':'否：d² ≠ 0'],["各阶同调维数",r.homology?'0, 0, 0':'未定义，不能套rank公式'],["标准锥是否可缩",!v.wrong||r.p===2?'是；h⁰(w)=(0,w)，h⁻¹(y,z)=y':'此处不是复形']],
    chart:{title:"两次微分的实际复合",xlabel:r.p?'输入 x∈F'+r.p:'输入 x∈Q 的整数示例',ylabel:'d²(x)',series:[{label:'当前符号下的d²',points:(r.p?Array.from({length:r.p},(_,i)=>i):[-2,-1,0,1,2]).map(x=>[x,r.p?mod(r.square*x,r.p):r.square*x]),dots:true}]},
    text:"标准负号下h⁰(w)=(0,w)、h⁻¹(y,z)=y满足d h+h d=id，可直接验证三种次数。特征2里−1=1，所以两个开关给出同一微分；它不能支持在Q或其他特征下删除负号。非复形时即使每个矩阵都有秩，也不能把维数减秩叫作同调。"};}}
 };
 return Object.assign(core.create("research-derived-category",configs),{roof,cone});
});
