(function(root,factory){"use strict";const core=typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab;const lib=factory(core);if(typeof module==="object"&&module.exports)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-math",lib.mount);})(typeof globalThis!=="undefined"?globalThis:this,function(core){
  "use strict";
  const blue="#3978bd",red="#b75438",green="#20826c",purple="#8057a0";
  const range=(a,b,n=61)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
  const S=(label,color,points,dash)=>({label,color,points,...(dash?{dash}:{})});
  const primes=[5,7,11,13,17,19];
  const mod=(x,p)=>((x%p)+p)%p;
  function inv(a,p){a=mod(a,p);for(let n=1;n<p;n++)if(a*n%p===1)return n;throw Error("noninvertible denominator");}
  function count(p,a,b){const bins=[],points=[];for(let x=0;x<p;x++){let n=0;for(let y=0;y<p;y++)if(mod(y*y-x*x*x-a*x-b,p)===0){n++;points.push([x,y]);}bins.push([x,n]);}return {bins,points,N:points.length+1,singular:mod(4*a*a*a+27*b*b,p)===0};}
  function add(P,Q){if(P===null)return Q;if(Q===null)return P;const p=17;if(P[0]===Q[0]&&mod(P[1]+Q[1],p)===0)return null;const l=mod((P[0]===Q[0]?3*P[0]*P[0]+2:Q[1]-P[1])*inv(P[0]===Q[0]?2*P[1]:Q[0]-P[0],p),p);const x=mod(l*l-P[0]-Q[0],p);return [x,mod(l*(P[0]-x)-P[1],p)];}
  function multiple(n){let R=null;for(let j=0;j<mod(n,19);j++)R=add(R,[5,1]);return R;}
  const point=P=>P===null?"O（无穷远点）":"("+P.join(", ")+")";
  function delta(y,N){const q=Math.exp(-2*Math.PI*y);let log=-2*Math.PI*y;for(let j=1;j<=N;j++)log+=24*Math.log1p(-(q**j));return Math.exp(log);}
  function divisorPowerSum(n,p){let total=0;for(let d=1;d<=n;d++)if(n%d===0)total+=d**p;return total;}
  function eisensteinDelta(y,N){const q=Math.exp(-2*Math.PI*y);let e4=1,e6=1,qn=q;for(let n=1;n<=N;n++){e4+=240*divisorPowerSum(n,3)*qn;e6-=504*divisorPowerSum(n,5)*qn;qn*=q;}return {e4,e6,delta:(e4**3-e6**2)/1728};}
  function frob(p,a,r){let A=2,B=a;const out=[[1,B]];for(let j=2;j<=r;j++){const C=a*B-p*A;A=B;B=C;out.push([j,B]);}return out;}
  const velocities=[-2,-1,1,2],c=[1,-2,2,-1],Z=2*(Math.exp(-2)+Math.exp(-.5)),M=velocities.map(x=>Math.exp(-x*x/2)/Z);
  const moments=f=>[f.reduce((a,b)=>a+b,0),f.reduce((a,b,i)=>a+b*velocities[i],0),f.reduce((a,b,i)=>a+b*velocities[i]**2/2,0)];
  const waveRate=n=>n[1]*n[2]*(n[0]+n[3])-n[0]*n[3]*(n[1]+n[2]);
  function waves(initial){let s=0;const signs=[1,-1,-1,1],states=[[0,...initial]],h=.0005;const at=x=>initial.map((n,i)=>n+signs[i]*x),rate=x=>waveRate(at(x));for(let j=1;j<=2000;j++){const a=rate(s),b=rate(s+h*a/2),d=rate(s+h*b/2),e=rate(s+h*d);s+=h*(a+2*b+2*d+e)/6;if(j%25===0)states.push([j*h,...at(s)]);}return states;}
  const configs={
    "nt-counting":{title:"逐个剩余类计数，再检查曲线是否光滑",predict:"先预测：每个 x 一定对应两个 y 吗？把 a=b=0 后还能使用 Hasse 定理吗？",scope:"有限域穷举；p 由素数编号选择。奇异三次曲线仍可计数，但不是本讲的椭圆曲线。",controls:[["prime","素数编号（0→5,1→7,2→11,3→13,4→17,5→19）",0,5,1,0],["a","系数 a",-5,5,1,1],["b","系数 b",-5,5,1,1]],compute(v){const p=primes[v.prime],r=count(p,v.a,v.b),a=p+1-r.N;return {numeric:{p,N:r.N,trace:a,singular:r.singular?1:0,affine:r.points},rows:[["素数 p",p],["仿射点数",r.N-1],["加上 O 后的总数",r.N],["aₚ=p+1−N",a],["光滑性",r.singular?"奇异：Hasse 定理不适用":"非奇异"],["Hasse 理论半宽 2√p",2*Math.sqrt(p)]],chart:{title:"每个 x 上的 y 解数（离散）",xlabel:"x 的剩余类",ylabel:"解数",series:[S("y 解数",blue,r.bins)],xticks:[0,Math.floor(p/2),p-1]},text:r.singular?"判别式为零。图仍是合法的同余方程计数，但不能把它称为椭圆曲线群。":"0、1、2 个根分别对应非平方、零、非零平方；最后再加上一个无穷远点。"};}},
    "nt-group":{title:"用倍点检验群运算",predict:"先预测：mP+nP 是否等于 (m+n)P？19P 出现在平面中的哪里？",scope:"固定光滑曲线 y²=x³+2x+2 over F17，P=(5,1)，群阶 19。坐标是剩余类，不是实平面割线的连续图。",controls:[["m","整数 m",-19,19,1,2],["n","整数 n",-19,19,1,3]],compute(v){const P=multiple(v.m),Q=multiple(v.n),R=add(P,Q),points=[];for(let j=1;j<19;j++)points.push([j,multiple(j)[0]]);return {numeric:{P,Q,R,expected:multiple(v.m+v.n),order:19},rows:[["mP",point(P)],["nP",point(Q)],["mP+nP",point(R)],["(m+n)P",point(multiple(v.m+v.n))],["19P",point(multiple(19))]],chart:{title:"倍点的 x 坐标会重复，点未必重复",xlabel:"倍数 j（1 至 18）",ylabel:"x(jP) mod 17",series:[S("倍点 x",blue,points)]},text:"jP 与 (19−j)P 互为负点，拥有相同 x 和相反 y。O 没有仿射坐标，因此图没有给 19P 编造一个位置。"};}},
    "nt-modular":{
      title:"用乘积与 Eisenstein 级数交叉检查 Δ",
      predict:"先预测：y 较小时 q 接近 1，固定 N 的两种截断会怎样偏离？y=1 时 S 变换虽退化，独立表达还能否发现实现错误？",
      scope:"路径 A 计算 q∏(1−qⁿ)²⁴；路径 B 独立计算 E₄=1+240Σσ₃(n)qⁿ、E₆=1−504Σσ₅(n)qⁿ，再用 (E₄³−E₆²)/1728。表格保留有符号相对残差，图只画绝对值的十进数量级；有限截断只给数值证据。",
      controls:[["y","虚部 y",.35,2.5,.05,.4],["N","两种展开的截断 N",1,60,1,3]],
      compute(v){
        const A=delta(v.y,v.N),B=delta(1/v.y,v.N),T=v.y**12*A,error=B/T-1;
        const E=eisensteinDelta(v.y,v.N),cross=E.delta/A-1,displayFloor=1e-16;
        const points=range(1,60,60).map(n=>{
          const P=delta(v.y,n),Q=delta(1/v.y,n),D=eisensteinDelta(v.y,n).delta;
          return [n,Q/(v.y**12*P)-1,D/P-1];
        });
        const logResidual=x=>Math.log10(Math.max(Math.abs(x),displayFloor));
        return {
          numeric:{delta:A,eisensteinDelta:E.delta,e4:E.e4,e6:E.e6,eisensteinRelativeError:cross,transformed:B,scaled:T,relativeError:error},
          rows:[["乘积 Δ_N(iy)",A],["Eisenstein Δ_N^E(iy)",E.delta],["独立表达相对差 Δ_N^E/Δ_N−1",cross],["乘积 Δ_N(i/y)",B],["y¹² 乘积 Δ_N(iy)",T],["S 变换相对残差",error]],
          chart:{title:"两类相对残差的数量级",xlabel:"截断项数 n",ylabel:"log₁₀ |相对残差|",series:[S("S 变换残差",red,points.map(p=>[p[0],logResidual(p[1])])),S("Eisenstein / 乘积差",blue,points.map(p=>[p[0],logResidual(p[2])]),"6 4")]},
          text:v.y===1
            ?"y=1 时 S 变换两侧是同一个乘积计算，红色残差代数上为 0；图为显示它而把 |残差| 截到 10⁻¹⁶。这个数只是显示下限，不是误差小于 10⁻¹⁶ 的证书。蓝线仍是独立表达检查。"
            :"红线检查 y 与 1/y 的变换一致性，蓝线检查两种独立表达；表中数值保留符号，图只画 log₁₀|残差|。截断误差消失后仍可能停在浮点舍入平台；大 y 时 E₄³−E₆² 的相消尤其明显，例如 y=2.5 时蓝色相对差约 6.4×10⁻¹³，继续增大 N 不会消除它。"
        };
      }
    },
    "nt-frobenius":{title:"一次点数怎样编码多个扩域？",predict:"先预测：E(Fp²) 的点数是否等于 E(Fp) 点数的平方？",scope:"固定 y²=x³+x+1，只用好素数 p=5,7,11,13,17,19；以 Frobenius 特征多项式推导扩域计数。",controls:[["prime","素数编号（0→5,1→7,2→11,3→13,4→17,5→19）",0,5,1,0],["r","扩域次数 r",1,8,1,2]],compute(v){const p=primes[v.prime],N=count(p,1,1).N,a=p+1-N,seq=frob(p,a,8),A=seq[v.r-1][1];return {numeric:{p,N,trace:a,powerTrace:A,extensionCount:p**v.r+1-A},rows:[["p",p],["#E(Fp)",N],["aₚ",a],["αʳ+βʳ",A],["#E(Fpʳ)",p**v.r+1-A]],chart:{title:"扩域迹的振荡遵守 Weil 窗口",xlabel:"扩域次数 r",ylabel:"(αʳ+βʳ)/(2p^(r/2))",series:[S("归一化迹",blue,seq.map(([r,A])=>[r,A/(2*p**(r/2))])),S("上界",red,[[1,1],[8,1]],"6 4"),S("下界",red,[[1,-1],[8,-1]],"6 4")]},text:"A₀=2、A₁=aₚ，Aᵣ=aₚAᵣ₋₁−pAᵣ₋₂。这里是同一曲线在扩域中的点，不能把 r 当成新的素数编号。"};}},
    "kinetic-marginals":{title:"同样的一粒子边缘，是否有同样的相遇倾向？",predict:"先预测：改变两粒子速度相关性，会改变任一粒子的方差吗？会改变位置差吗？",scope:"无碰撞自由流 Xᵢ(t)=Xᵢ(0)+tVᵢ。初始位置独立标准 Gaussian，速度边缘标准 Gaussian、协方差 ρ，位置与速度独立；量已无量纲化。",controls:[["t","自由飞行时间 t",0,4,.1,1],["rho","初始速度相关 ρ",-.95,.95,.05,.5]],compute(v){const variance=1+v.t*v.t,cov=v.rho*v.t*v.t,difference=2*(variance-cov),ind=2*variance,extent=4*Math.sqrt(Math.max(difference,ind)),pdf=(x,z)=>Math.exp(-x*x/(2*z))/Math.sqrt(2*Math.PI*z);return {numeric:{variance,covariance:cov,correlation:cov/variance,differenceVariance:difference,encounterDensity:pdf(0,difference)},rows:[["每个粒子位置方差",variance],["两位置协方差",cov],["位置差方差",difference],["位置差在 0 的密度",pdf(0,difference)]],chart:{title:"相对位置分布：小距离概率要看联合律",xlabel:"位置差 x₁−x₂",ylabel:"概率密度",series:[S("当前相关速度",blue,range(-extent,extent,161).map(x=>[x,pdf(x,difference)])),S("相同边缘、独立速度",red,range(-extent,extent,161).map(x=>[x,pdf(x,ind)]),"6 4")]},text:"横轴覆盖较宽分布的正负四个标准差，随参数缩放。密度在 0 的值不是相撞概率；连续变量恰好相等的概率为零。小窗口 |X₁−X₂|<h 的概率约为 2h 乘此密度。这个无碰撞模型用于显示闭合缺口，不是硬球动力学。"};}},
    "kinetic-collisions":{title:"改变散射法向，检查三类守恒量",predict:"先预测：掠碰与正碰中，哪一种会交换全部入射速度？",scope:"二维等质量无旋转的弹性二体碰撞，入射 v=(u,0)、w=(0,0)。θ 指单位碰撞法向与 x 轴夹角，速度与质量均已无量纲化。",controls:[["u","入射速率 u",.2,4,.1,2],["angle","法向夹角 θ（度）",0,90,1,45]],compute(v){const angle=v.angle*Math.PI/180,n=[Math.cos(angle),Math.sin(angle)],c=v.u*n[0],A=[v.u-c*n[0],-c*n[1]],B=[c*n[0],c*n[1]],energy=(A[0]**2+A[1]**2+B[0]**2+B[1]**2)/2;return {numeric:{v:A,w:B,momentum:[A[0]+B[0],A[1]+B[1]],energy,energyBefore:v.u*v.u/2},rows:[["碰后 v",A.map(x=>x.toFixed(5)).join(", ")],["碰后 w",B.map(x=>x.toFixed(5)).join(", ")],["总动量 x",A[0]+B[0]],["总动量 y",A[1]+B[1]],["总动能",energy]],chart:{title:"法向控制两粒子的能量分配",xlabel:"法向夹角 θ（度）",ylabel:"单粒子动能",series:[S("粒子 v",blue,range(0,90,91).map(d=>[d,v.u*v.u*Math.sin(d*Math.PI/180)**2/2])),S("粒子 w",red,range(0,90,91).map(d=>[d,v.u*v.u*Math.cos(d*Math.PI/180)**2/2]))]},text:"两条能量曲线之和恒定。碰撞公式保持微观可逆；Boltzmann 熵增还需要关于入射粒子统计结构的极限论证。"};}},
    "kinetic-hydro":{title:"非平衡形状消失，守恒矩留下",predict:"先预测：ε 减半会改变最终平衡，还是改变达到平衡的速度？",scope:"四速、空间齐次 BGK 教学模型；v=(-2,-1,1,2)，固定 Gaussian 权重 M。只显示碰撞松弛，未包含空间输运、黏性或 Navier–Stokes 极限。",controls:[["epsilon","松弛时间 ε",.05,1,.05,.5],["eta","初始零矩扰动 η",-.04,.04,.005,.03],["t","观察时间 t",0,3,.05,.5]],compute(v){const f=M.map((x,i)=>x+v.eta*c[i]*Math.exp(-v.t/v.epsilon)),m=moments(f),initial=M.map((x,i)=>x+v.eta*c[i]),H=f.reduce((s,x,i)=>s+x*Math.log(x/M[i]),0);return {numeric:{f,M,mass:m[0],momentum:m[1],energy:m[2],relativeEntropy:H,deviationL1:f.reduce((s,x,i)=>s+Math.abs(x-M[i]),0)},rows:[["总质量",m[0]],["总动量",m[1]],["总动能",m[2]],["相对熵 H(f|M)",H],["L¹ 偏差",f.reduce((s,x,i)=>s+Math.abs(x-M[i]),0)]],chart:{title:"四个速度格上的分布形状",xlabel:"离散速度 v",ylabel:"概率质量",series:[S("初始 f(0)",red,velocities.map((x,i)=>[x,initial[i]]),"6 4"),S("当前 f(t)",blue,velocities.map((x,i)=>[x,f[i]])),S("同矩平衡 M",green,velocities.map((x,i)=>[x,M[i]]),"2 4")]},text:"扰动向量 (1,−2,2,−1) 对 1、v、v² 的加权和都是零。这里只让非守恒部分指数衰减；快速松弛本身并没有推出任何空间流体方程。"};}},
    "kinetic-waves":{title:"一个共振通道如何转移谱占据？",predict:"先预测：四个 n 相等时是否还有净流？频率不等时总占据与总能量能否同时守恒？",scope:"共振四模态教学截断，ω=(1,2,3,4)，通道 1+4↔2+3，碰撞系数设为 1。曲线用固定步长 RK4，时间无量纲；不模拟原始 NLS。",controls:[["n1","初始谱占据 n₁",.2,5,.1,1],["n2","初始谱占据 n₂",.2,5,.1,2],["n3","初始谱占据 n₃",.2,5,.1,2],["n4","初始谱占据 n₄",.2,5,.1,1]],compute(v){const initial=[v.n1,v.n2,v.n3,v.n4],states=waves(initial),last=states[states.length-1].slice(1),J=waveRate(initial),Q=initial.reduce((s,x)=>s+x,0),E=initial.reduce((s,x,i)=>s+(i+1)*x,0),S0=initial.reduce((s,x)=>s+Math.log(x),0),S1=last.reduce((s,x)=>s+Math.log(x),0);return {numeric:{initial,final:last,rate:J,action:Q,energy:E,entropyGain:S1-S0,states},rows:[["初始净流 J（流入 1、4）",J],["总谱占据 Σn",Q],["总谱能量 Σωn",E],["t=1 的熵增 Σlog n",S1-S0],["t=1 占据",last.map(x=>x.toFixed(5)).join(", ")]],chart:{title:"保守的四模态谱再分配",xlabel:"无量纲动力学时间 τ",ylabel:"谱占据 nᵢ",series:[blue,red,green,purple].map((color,i)=>S("模态 "+(i+1),color,states.map(row=>[row[0],row[i+1]]),i>1?"6 4":undefined))},text:"dn₁/dτ=dn₄/dτ=J，dn₂/dτ=dn₃/dτ=−J。两个守恒量来自共振配平；更多额外守恒量是单通道截断的限制，不能据其平衡宣布完整波谱热化。"};}}
  };
  return core.create("research-math",configs);
});
