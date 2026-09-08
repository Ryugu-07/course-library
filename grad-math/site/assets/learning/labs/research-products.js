(function(root,factory){"use strict";const lib=factory(typeof module==="object"&&module.exports?require("../research-renderer"):root.ResearchLab);if(typeof module==="object"&&module.exports)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-products",lib.mount);})(typeof globalThis!=="undefined"?globalThis:this,function(core){
 "use strict";
 function frequency(N,A,B,phase){const theta=Math.PI*phase,mean=A*B*Math.cos(theta)/2;return {mean,harmonic:A*B/2,vRe:B*Math.cos(theta)/2,vIm:B*Math.sin(theta)/2,u:[[-N,A/2],[N,A/2]],v:[[-N,B/2],[N,B/2]],product:[[-2*N,A*B/4],[0,Math.abs(mean)],[2*N,A*B/4]]};}
 function jet(lambda){const error=2*Math.sin(lambda/2)**2,bound=lambda*lambda/2;return {error,bound,ratio:error/lambda**2};}
 const configs={reconstruction:{title:"高频各自消失，乘积的零频也消失吗？",predict:"先预测：只增大N，与改变相位θ，哪一个能把乘积均值从1/2改为0？",
 scope:"2π圆周、归一化dx/(2π)。u=Acos(Nx)、v=Bcos(Nx+θ)，使用复指数Fourier系数。点的高度是系数绝对值；表格另报相位和零模符号，没有离散采样混叠。",
 controls:[["N","整数频率 N",2,64,2,8],["A","第一振幅 A",.5,2,.5,1],["B","第二振幅 B",.5,2,.5,1],["phase","相位 θ/π",0,1,1/12,0]],
 compute(v){const m=frequency(v.N,v.A,v.B,v.phase);return {numeric:m,rows:[["u与常数的配对",0],["v与常数的配对",0],["乘积均值（有符号）",m.mean],["乘积2N余弦振幅",m.harmonic],["v的+N系数实部",m.vRe],["v的+N系数虚部",m.vIm],["乘积每个±2N复系数的模",v.A*v.B/4],["负阶s=−1：E‖Z_N‖²",2/(1+v.N*v.N)],["Wick余项到随机常数的平方误差（s=−1）",4/(1+4*v.N*v.N)],["Wick常数均值／方差","0／4"]],chart:{title:"复Fourier系数的绝对值",xlabel:"整数频率 k",ylabel:"系数绝对值",xticks:[-2*v.N,-v.N,0,v.N,2*v.N],series:[{label:"u：±N",points:m.u,dots:true},{label:"v：±N（等幅点可重叠）",points:m.v,dots:true},{label:"uv：0及±2N",points:m.product,dots:true}]},text:"+N与−N产生零频，+N与+N产生2N。增大N只移动非零频率的位置，不改变均值。θ/π=1/2时零模消失，θ/π=1时变负；绝对值图不会显示该符号，须读表。随机单壳层的两项误差采用同一Gaussian pair的解析二阶矩，未做随机抽样，也未证明一般乘积定理。"};}},
 jet:{title:"缩小观察窗，一阶局部描述漏掉多少？",predict:"先预测：观察尺度减半时，cos在原点的一阶jet误差接近减半，还是减到四分之一？",
 scope:"f(y)=cos y，基点0，局部一阶jet为1；窗口|y|≤λ。显示最大点误差，它也控制L¹范数≤1测试函数的配对误差。仅为多项式模型。",
 controls:[["lambda","观察尺度 λ",.05,1,.05,.25]],
 compute(v){const m=jet(v.lambda),points=Array.from({length:40},(_,i)=>.025*(i+1));return {numeric:m,rows:[["最大点误差 1−cosλ",m.error],["Taylor上界 λ²/2",m.bound],["误差除以 λ²",m.ratio],["尺度减半后的误差",jet(v.lambda/2).error],["减半后／原误差",jet(v.lambda/2).error/m.error]],chart:{title:"二阶余项的缩放",xlabel:"观察尺度 λ",ylabel:"误差除以λ²",series:[{label:"实际最大误差／λ²",points:points.map(x=>[x,jet(x).ratio])},{label:"Taylor上界／λ²=1/2",points:[[.025,.5],[1,.5]]}],marker:[v.lambda,m.ratio]},text:"λ趋零时比值趋1/2，最大点误差按λ²缩小。零局部描述也可以相容地重建零函数，但不能重建cos。一般重建还需模型代数、缩放界及基点相容性；此图不是随机模型或SPDE求解器。"};}}
 };
 return Object.assign(core.create("research-products",configs),{frequency,jet});
});
