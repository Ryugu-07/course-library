(function(root,factory){
  "use strict";
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root&&root.CourseLearning)root.CourseLearning.register("random-matrix-norm",api.mount);
  if(typeof require==="function"&&require.main===module)console.log(api.selfTest());
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";
  const DEFAULTS={mode:"net",major:4,minor:1,angle:17,count:16,preset:"gaussian",m:5,n:4,seed:20260722,iterations:18,start:"ones"};
  const PRESETS=[
    {id:"gaussian",label:"高斯矩形",m:5,n:4},
    {id:"rademacher",label:"随机符号矩形",m:5,n:4},
    {id:"wigner",label:"Wigner 对称",m:6,n:6},
    {id:"covariance",label:"未扣样本均值的二阶矩",m:8,n:4},
    {id:"correlated",label:"相关条目诊断",m:6,n:4},
    {id:"heavy-tail",label:"无限方差重尾诊断",m:6,n:4},
    {id:"blind",label:"幂迭代盲点",m:2,n:2,start:"axis"},
    {id:"hole",label:"四维方向遗漏",m:2,n:4,start:"ones"}
  ];
  const QUESTIONS=[
    ["扫描许多方向后，最大读数必然是什么？",["算子范数的下界","整个球面的上确界"],0,"有限方向属于球面，只能先给下界；上界还要覆盖证明。"],
    ["把每个坐标平面的角度继续加密，能否自动覆盖四维球面？",["不能，仍会漏掉四个坐标同时非零的方向","能，只要方向数量足够多"],0,"与二稀疏方向的距离存在正下界，增加角度数量无法消除。"],
    ["幂迭代的特征向量残差为零，能否证明找到了最大特征值？",["不能，可能停在另一个特征向量","能，残差零就是最大值"],0,"残差判断特征对是否成立，不负责判断它是不是谱的顶端。"],
    ["一次种子实验吻合 √m+√n，能否证明高概率界？",["不能，需要分布假设与概率论证","能，可以据此确定通用常数"],0,"一个固定矩阵的计算和一族随机矩阵的概率量词不同。"]
  ];
  function number(v,name,lo,hi,integer=false){
    if(typeof v==="string"){if(!v.trim())throw Error(name+"不能为空");v=Number(v);}
    if(typeof v!=="number"||!Number.isFinite(v)||v<lo||v>hi||(integer&&!Number.isInteger(v)))throw Error(name+"须为 "+lo+" 至 "+hi+" 的"+(integer?"整数":"有限数"));
    return v;
  }
  function config(raw={}){
    if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("参数须为对象");
    const s=Object.assign({},DEFAULTS,raw);
    if(!["net","matrix"].includes(s.mode))throw Error("未知实验");
    if(s.mode==="net"){
      s.major=number(s.major,"大奇异值",.1,10);s.minor=number(s.minor,"小奇异值",0,s.major);
      s.angle=number(s.angle,"奇异方向角",0,180);s.count=number(s.count,"方向数",4,256,true);
      if((s.count&(s.count-1))!==0)throw Error("方向数须为 4 至 256 的 2 的幂");
    }else{
      if(!PRESETS.some(p=>p.id===s.preset))throw Error("未知矩阵模型");
      s.m=number(s.m,"行数 m",2,8,true);s.n=number(s.n,"列数 n",2,8,true);
      s.seed=number(s.seed,"seed",0,4294967295,true);s.iterations=number(s.iterations,"迭代步数",0,64,true);
      if(!["ones","axis","difference"].includes(s.start))throw Error("未知初始向量");
      if(s.preset==="wigner"&&s.m!==s.n)throw Error("Wigner 模型要求 m=n");
      if(s.preset==="blind"&&(s.m!==2||s.n!==2))throw Error("幂迭代盲点固定为 2×2");
      if(s.preset==="hole"&&(s.m!==2||s.n!==4))throw Error("方向遗漏固定为 2×4");
    }
    return s;
  }
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const norm=v=>Math.hypot(...v);
  const mv=(a,v)=>a.map(r=>dot(r,v));
  const transpose=a=>a[0].map((_,j)=>a.map(r=>r[j]));
  const gram=a=>{const t=transpose(a);return t.map(u=>t.map(v=>dot(u,v)));};
  const eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
  const unit=v=>{const h=norm(v);if(h===0)throw Error("零向量不能归一化");return v.map(x=>x/h);};
  function trig(deg){
    if(deg%90===0){const k=((deg/90)%4+4)%4;return [[1,0],[0,1],[-1,0],[0,-1]][k];}
    const t=deg*Math.PI/180;return [Math.cos(t),Math.sin(t)];
  }
  function createRng(seed){
    let state=number(seed,"seed",0,4294967295,true),spare=null;
    const uniform=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return (state+.5)/4294967296;};
    const normal=()=>{if(spare!==null){const z=spare;spare=null;return z;}const r=Math.sqrt(-2*Math.log(uniform())),t=2*Math.PI*uniform();spare=r*Math.sin(t);return r*Math.cos(t);};
    return {uniform,normal};
  }
  function net(s){
    const [c,h]=trig(s.angle),a=[[s.major*c,s.major*h],[-s.minor*h,s.minor*c]];
    function row(deg){const v=trig(deg),av=mv(a,v);return {angle:deg,vector:v,image:av,value:norm(av)};}
    const directions=Array.from({length:s.count},(_,i)=>row(360*i/s.count));
    const curve=Array.from({length:721},(_,i)=>row(i/2));
    const levels=[];
    for(let n=4;n<=s.count;n*=2){
      const maximum=Math.max(...Array.from({length:n},(_,i)=>row(360*i/n).value));
      const epsilon=2*Math.sin(Math.PI/(2*n));
      levels.push({count:n,epsilon,maximum,generic:maximum/(1-epsilon),sharp:maximum/Math.cos(Math.PI/n)});
    }
    return {config:s,matrix:a,directions,curve,levels,exactNorm:s.major,...levels[levels.length-1]};
  }
  function jacobi(input){
    const n=input.length;
    if(!n||input.some(r=>r.length!==n||r.some(x=>!Number.isFinite(x))))throw Error("Jacobi 需要有限方阵");
    if(input.some((r,i)=>r.some((x,j)=>x!==input[j][i])))throw Error("Jacobi 需要对称矩阵");
    const a=input.map(r=>r.slice()),q=eye(n),scale=Math.hypot(...a.flat()),tol=32*Number.EPSILON*scale;
    let rotations=0,off=0;
    for(;rotations<100*n*n;rotations++){
      let p=0,r=0;off=0;
      for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i][j])>off){off=Math.abs(a[i][j]);p=i;r=j;}
      if(off<=tol)break;
      const tau=(a[r][r]-a[p][p])/(2*a[p][r]);
      const t=(tau>=0?1:-1)/(Math.abs(tau)+Math.hypot(1,tau)),c=1/Math.hypot(1,t),h=t*c,ap=a[p][p],ar=a[r][r],b=a[p][r];
      a[p][p]=ap-t*b;a[r][r]=ar+t*b;a[p][r]=a[r][p]=0;
      for(let k=0;k<n;k++){
        if(k!==p&&k!==r){const x=a[k][p],y=a[k][r];a[k][p]=a[p][k]=c*x-h*y;a[k][r]=a[r][k]=h*x+c*y;}
        const x=q[k][p],y=q[k][r];q[k][p]=c*x-h*y;q[k][r]=h*x+c*y;
      }
    }
    off=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)off=Math.max(off,Math.abs(a[i][j]));
    const pairs=Array.from({length:n},(_,i)=>{
      const vector=q.map(r=>r[i]),value=a[i][i],image=mv(input,vector);
      return {value,vector,image,residual:norm(image.map((x,j)=>x-value*vector[j]))};
    }).sort((a,b)=>b.value-a.value);
    let orthogonality=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)orthogonality=Math.max(orthogonality,Math.abs(dot(pairs[i].vector,pairs[j].vector)-+(i===j)));
    return {pairs,rotations,off,scale,tolerance:tol,converged:off<=tol,orthogonality};
  }
  function directionGrid(n){
    const out=[];
    for(let i=0;i<n;i++){const v=Array(n).fill(0);v[i]=1;out.push(v);}
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)for(let k=0;k<24;k++){
      const v=Array(n).fill(0),[c,s]=trig(15*k);v[i]=c;v[j]=s;out.push(v);
    }
    return out;
  }
  function makeMatrix(s){
    if(s.preset==="blind")return {matrix:[[1,0],[0,2]],source:null};
    if(s.preset==="hole")return {matrix:[[.5,.5,.5,.5],[0,0,0,0]],source:null};
    const rng=createRng(s.seed),sample=()=>s.preset==="rademacher"?(rng.uniform()<.5?-1:1):s.preset==="heavy-tail"?(rng.uniform()<.5?-1:1)*.75*Math.pow(1-rng.uniform(),-2/3):rng.normal();
    if(s.preset==="wigner"){
      const a=Array.from({length:s.n},()=>Array(s.n).fill(0));
      for(let i=0;i<s.n;i++)for(let j=i;j<s.n;j++)a[i][j]=a[j][i]=sample()/Math.sqrt(s.n);
      return {matrix:a,source:null};
    }
    const x=Array.from({length:s.m},()=>{
      if(s.preset==="correlated"){const common=1+.15*rng.normal();return Array.from({length:s.n},()=>common+.12*rng.normal());}
      return Array.from({length:s.n},sample);
    });
    return s.preset==="covariance"?{matrix:gram(x).map(r=>r.map(v=>v/s.m)),source:x}:{matrix:x,source:null};
  }
  function matrix(s){
    const {matrix:a,source}=makeMatrix(s),g=gram(a),target=s.preset==="covariance"?a:g,eigen=jacobi(target);
    const top=eigen.pairs[0].value,operatorNorm=s.preset==="covariance"?top:Math.sqrt(Math.max(0,top));
    const directions=directionGrid(s.n).map((vector,index)=>{const image=mv(a,vector);return {index,vector,image,value:norm(image)};});
    let v=unit(s.start==="ones"?Array(s.n).fill(1):s.start==="axis"?[1,...Array(s.n-1).fill(0)]:[1,-1,...Array(s.n-2).fill(0)]);
    const history=[];let stop="达到指定步数";
    for(let k=0;k<=s.iterations;k++){
      const image=mv(target,v),rayleigh=dot(v,image),av=mv(a,v);
      history.push({iteration:k,vector:v.slice(),image,rayleigh,residual:norm(image.map((x,i)=>x-rayleigh*v[i])),estimate:norm(av)});
      if(k===s.iterations)break;
      if(norm(image)===0){stop="迭代像为零；不能归一化，停止";break;}
      v=unit(image);
    }
    const spectrum=s.preset==="wigner"?jacobi(a):null;
    const reference=s.preset==="wigner"?2:s.preset==="covariance"?(1+Math.sqrt(s.n/s.m))**2:Math.sqrt(s.m)+Math.sqrt(s.n);
    return {config:s,matrix:a,source,gram:g,target,eigen,spectrum,operatorNorm,directions,gridMax:Math.max(...directions.map(r=>r.value)),history,stop,reference,referenceValid:["gaussian","rademacher","wigner","covariance"].includes(s.preset),frobenius:Math.hypot(...a.flat())};
  }
  function snapshot(raw){const s=config(raw);return s.mode==="net"?net(s):matrix(s);}
  function fmt(x){
    if(x===null||x===undefined)return "—";
    if(Array.isArray(x))return "["+x.map(fmt).join(", ")+"]";
    if(typeof x!=="number")return String(x);
    if(x===0)return "0";
    return Number(x.toPrecision(9)).toString();
  }
  function ledgers(d){
    const mat=(key,title,a)=>({key,title,headers:["行",...a[0].map((_,i)=>"列 "+(i+1))],rows:a.map((r,i)=>[i+1,...r])});
    if(d.config.mode==="net")return [
      mat("matrix","旋转奇异方向的矩阵 A",d.matrix),
      {key:"levels",title:"嵌套加密：下界与两个有证明的上界",headers:["N","覆盖半径 ε","网格下界 L","L/(1−ε)","L/cos(π/N)","解析范数"],rows:d.levels.map(r=>[r.count,r.epsilon,r.maximum,r.generic,r.sharp,d.exactNorm])},
      {key:"directions",title:"全部网点与矩阵像",headers:["角度 °","单位方向 u","Au","‖Au‖"],rows:d.directions.map(r=>[r.angle,r.vector,r.image,r.value])},
      {key:"curve",title:"完整半度扫描（画曲线用，覆盖证书另由公式给出）",headers:["角度 °","u","Au","‖Au‖"],rows:d.curve.map(r=>[r.angle,r.vector,r.image,r.value])}
    ];
    const out=[mat("matrix","实际研究的矩阵 A（或二阶矩 S）",d.matrix)];
    if(d.source)out.push(mat("source","原始数据 X；S=XᵀX/m，未扣样本均值",d.source));
    out.push(mat("gram","AᵀA；二阶矩模式下这是 S²",d.gram));
    out.push({key:"eigen",title:"Jacobi 数值特征对：二阶矩模式对 S，其他模式对 AᵀA",headers:["λ","q","Tq","‖Tq−λq‖"],rows:d.eigen.pairs.map(r=>[r.value,r.vector,r.image,r.residual])});
    if(d.spectrum)out.push({key:"wigner",title:"Wigner 有符号特征值，区别于 AᵀA 的特征值",headers:["λ","q","Aq","残差"],rows:d.spectrum.pairs.map(r=>[r.value,r.vector,r.image,r.residual])});
    out.push({key:"history",title:"幂迭代全过程（第 0 行为初始向量）",headers:["步","v","Tv","Rayleigh 商","残差","‖Av‖ 下界"],rows:d.history.map(r=>[r.iteration,r.vector,r.image,r.rayleigh,r.residual,r.estimate])});
    out.push({key:"directions",title:"全部坐标平面方向扫描；包含重复方向，未证明高维覆盖",headers:["索引","u","Au","‖Au‖"],rows:d.directions.map(r=>[r.index,r.vector,r.image,r.value])});
    return out;
  }
  function plots(d){
    if(d.config.mode==="net")return [
      {title:"单位圆上的网点：最大角距离 π/N，最大弦长 ε",x:"u₁",y:"u₂",xmin:-1.2,xmax:1.2,ymin:-1.2,ymax:1.2,equal:true,series:[
        {key:"circle",color:"#687d8c",points:d.curve.map(r=>r.vector),line:true},
        {key:"net",color:"#bf691e",points:d.directions.map(r=>r.vector),line:false},
        {key:"singular",color:"#8e53a3",points:[[0,0],trig(d.config.angle)],line:true},
        {key:"covering-chord",color:"#c54040",points:[[1,0],trig(180/d.config.count)],line:true}
      ]},
      {title:"有限方向读数与解析最大值",x:"方向角（度）",y:"‖Au‖",xmin:0,xmax:360,ymin:0,ymax:d.sharp*1.13,series:[
        {key:"response",color:"#327ab5",points:d.curve.map(r=>[r.angle,r.value]),line:true},
        {key:"samples",color:"#bf691e",points:d.directions.map(r=>[r.angle,r.value]),line:false},
        {key:"norm",color:"#8e53a3",points:[[0,d.exactNorm],[360,d.exactNorm]],line:true},
        {key:"upper",color:"#34815e",points:[[0,d.sharp],[360,d.sharp]],line:true}
      ]}
    ];
    const ymax=Math.max(d.operatorNorm,d.gridMax,...d.history.map(r=>r.estimate))*1.15||1;
    return [
      {title:"算法下界与数值谱范数",x:"幂迭代步数",y:"‖Av‖",xmin:0,xmax:Math.max(1,d.config.iterations),ymin:0,ymax,series:[
        {key:"power",color:"#327ab5",points:d.history.map(r=>[r.iteration,r.estimate]),line:true},
        {key:"norm",color:"#8e53a3",points:[[0,d.operatorNorm],[Math.max(1,d.config.iterations),d.operatorNorm]],line:true}
      ]},
      {title:"坐标平面扫描只给下界",x:"方向索引（含重复）",y:"‖Au‖",xmin:0,xmax:d.directions.length-1,ymin:0,ymax,series:[
        {key:"directions",color:"#bf691e",points:d.directions.map(r=>[r.index,r.value]),line:false},
        {key:"norm",color:"#8e53a3",points:[[0,d.operatorNorm],[d.directions.length-1,d.operatorNorm]],line:true}
      ]}
    ];
  }
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function svg(q){
    const left=q.equal?250:100,width=q.equal?400:750,height=q.equal?400:250,top=85;
    const x=v=>left+width*(v-q.xmin)/(q.xmax-q.xmin),y=v=>top+height-height*(v-q.ymin)/(q.ymax-q.ymin),bottom=top+height;
    let s='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="'+(bottom+90)+'" role="img" aria-label="'+esc(q.title)+'"><title>'+esc(q.title)+'</title><text x="25" y="32" font-size="22">'+esc(q.title)+'</text>';
    for(let i=0;i<5;i++){
      const xx=q.xmin+(q.xmax-q.xmin)*i/4,yy=q.ymin+(q.ymax-q.ymin)*i/4;
      s+='<path d="M'+left+' '+y(yy)+'H'+(left+width)+'" stroke="currentColor" opacity=".18"/><text x="'+(left-12)+'" y="'+(y(yy)+5)+'" text-anchor="end">'+fmt(Number(yy.toPrecision(4)))+'</text><text x="'+x(xx)+'" y="'+(bottom+28)+'" text-anchor="middle">'+fmt(Number(xx.toPrecision(4)))+'</text>';
    }
    s+='<text x="'+left+'" y="65">'+esc(q.y)+'</text><text x="'+(left+width/2)+'" y="'+(bottom+63)+'" text-anchor="middle">'+esc(q.x)+'</text>';
    for(const series of q.series){
      if(series.line)s+='<polyline data-series="'+series.key+'" points="'+series.points.map(p=>x(p[0])+','+y(p[1])).join(" ")+'" stroke="'+series.color+'" stroke-width="2" fill="none"/>';
      series.points.forEach((p,i)=>{s+='<circle data-series="'+series.key+'" data-index="'+i+'" cx="'+x(p[0])+'" cy="'+y(p[1])+'" r="'+(series.line?1.1:3.5)+'" fill="'+series.color+'"/>';});
    }
    return s+"</svg>";
  }
  function mount(container){
    const doc=container.ownerDocument;
    if(!doc.getElementById("rm129-style")){
      const style=doc.createElement("style");style.id="rm129-style";style.textContent=".rm129{color:var(--fg,#273646)}.rm129 .rm-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.rm129 label{display:flex;flex-direction:column;gap:6px}.rm129 input,.rm129 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.rm129 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.rm129 button[aria-pressed=true]{outline:3px solid #478aaa}.rm129 .rm-scroll{overflow:auto;max-width:100%;margin:16px 0}.rm129 .rm-scroll:focus{outline:3px solid #478aaa}.rm129 .rm-ledger{max-height:420px}.rm129 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.rm129 table{min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.rm129 th,.rm129 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.rm129 .rm-error{color:#c74b39}.rm129 [hidden]{display:none!important}.rm129 fieldset{margin:16px 0;padding:12px}.rm129 details{margin:16px 0}.rm129 summary{cursor:pointer;font-weight:600}.rm129 .rm-legend{font-size:.95em}.rm129 .rm-note{line-height:1.7}";
      doc.head.appendChild(style);
    }
    const field=(key,label,options)=>'<label data-field="'+key+'">'+label+(options?'<select data-key="'+key+'">'+options.map(([v,t])=>'<option value="'+v+'">'+t+'</option>').join("")+'</select>':'<input data-key="'+key+'" type="number" step="any">')+'</label>';
    container.innerHTML='<div class="rm129"><h3>从覆盖证书到数值算法</h3><div class="rm-controls">'+
      field("mode","实验",[["net","二维可证明 ε-网"],["matrix","小矩阵与算法"]])+
      field("major","大奇异值（0.1–10）")+field("minor","小奇异值（0–大奇异值）")+field("angle","最大拉伸方向（0–180°）")+
      field("count","圆上方向数",[4,8,16,32,64,128,256].map(n=>[n,n]))+
      field("preset","矩阵模型",PRESETS.map(p=>[p.id,p.label]))+field("m","行数 m（2–8）")+field("n","列数 n（2–8）")+field("seed","seed（0–4294967295）")+field("iterations","幂迭代步数（0–64）")+
      field("start","初始向量",[["ones","全 1 向量归一化"],["axis","第一坐标轴 e₁"],["difference","(1,−1,0,…) 归一化"]])+
      '</div><p class="rm-note">先做预测，再看结果。参数改变后保留预测；无效输入会保留原值，修正后需重新揭示。</p><div class="rm-questions">'+
      QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+q[0]+'</legend>'+q[1].map((a,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+a+'</button>').join("")+'</fieldset>').join("")+
      '</div><button type="button" data-action="reveal">揭示账本</button><button type="button" data-action="reset">重置预测</button><p class="rm-error" role="alert"></p><p class="rm-feedback" role="status"></p><div class="rm-results" hidden></div></div>';
    const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(QUESTIONS.length).fill(null),results=container.querySelector(".rm-results"),button=container.querySelector("[data-action=reveal]"),feedback=container.querySelector(".rm-feedback"),error=container.querySelector(".rm-error");
    fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
    let revealed=false,valid=null;
    function read(){return Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));}
    function render(d){
      const note=d.config.mode==="net"?
        "解析范数 "+fmt(d.exactNorm)+"；网格下界 "+fmt(d.maximum)+"；ε="+fmt(d.epsilon)+"；一般上界 "+fmt(d.generic)+"；二维更紧上界 "+fmt(d.sharp)+"。曲线采样只负责显示；覆盖半径由等角间隔证明。":
        "数值谱范数 "+fmt(d.operatorNorm)+"；坐标扫描下界 "+fmt(d.gridMax)+"；幂迭代下界 "+fmt(d.history.at(-1).estimate)+"。"+d.stop+"。Jacobi "+(d.eigen.converged?"达到相对停止条件":"未收敛")+"，旋转 "+d.eigen.rotations+" 次；最大非对角元 "+fmt(d.eigen.off)+"，停止阈值 "+fmt(d.eigen.tolerance)+"，正交误差 "+fmt(d.eigen.orthogonality)+"。这些是浮点诊断，不是区间算术的严格误差证书。Frobenius 确定上界 "+fmt(d.frobenius)+"。"+
        (d.referenceValid?"分布适用时的尺度参考 "+fmt(d.reference)+"；有限小矩阵不要求精确等于此值。":"此预设不满足 iid 次高斯尺度的适用假设。")+
        "伪随机生成器为 32 位 LCG；均匀数 (state+0.5)/2³²，经 Box–Muller 等变换。有限精度样本不是真正连续独立随机量。";
      results.innerHTML='<p class="rm-note">'+esc(note)+'</p><p class="rm-legend">蓝：响应／幂迭代；橙：有限扫描；紫：最大奇异方向／范数；绿：二维上界；圆图红弦：网点与相邻间隙中点的距离 ε。图和长表可聚焦后用方向键横向查看。</p>'+
        plots(d).map(q=>'<div class="rm-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
        ledgers(d).map(t=>'<details data-ledger="'+t.key+'"><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="rm-scroll rm-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(v=>'<td>'+esc(fmt(v))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("");
    }
    function score(){feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i][2]).length+" / "+QUESTIONS.length+"。"+QUESTIONS.map(q=>q[3]).join(" "):"";}
    function update(){
      const raw=read(),active=raw.mode==="net"?["mode","major","minor","angle","count"]:["mode","preset","m","n","seed","iterations","start"];
      fields.forEach(e=>e.parentElement.hidden=!active.includes(e.dataset.key));
      try{valid=config(raw);error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
      button.disabled=!valid||answers.some(x=>x===null);results.hidden=!revealed;
      if(revealed&&valid)render(snapshot(valid));score();
    }
    fields.forEach(e=>e.addEventListener(e.tagName==="SELECT"?"change":"input",()=>{
      if(e.dataset.key==="preset"){const p=PRESETS.find(p=>p.id===e.value);for(const k of ["m","n","start"])container.querySelector('[data-key="'+k+'"]').value=p[k]||(k==="start"?"ones":DEFAULTS[k]);}
      update();
    }));
    container.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{
      const i=Number(b.parentElement.dataset.question);answers[i]=Number(b.dataset.choice);
      b.parentElement.querySelectorAll("[data-choice]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));update();
    }));
    button.addEventListener("click",()=>{if(!button.disabled){revealed=true;update();}});
    container.querySelector("[data-action=reset]").addEventListener("click",()=>{answers.fill(null);revealed=false;container.querySelectorAll("[data-choice]").forEach(b=>b.setAttribute("aria-pressed","false"));update();container.querySelector("[data-choice]").focus();});
    update();
  }
  function selfTest(){
    let checks=0;const check=(b,s)=>{checks++;if(!b)throw Error(s);};
    const d=snapshot();check(d.maximum<=4+1e-14&&d.sharp>=4,"net sandwich");
    const b=snapshot({mode:"matrix",preset:"blind",m:2,n:2,start:"axis"});check(b.operatorNorm===2&&b.history.at(-1).estimate===1&&b.history.at(-1).residual===0,"blind eigenpair");
    const h=snapshot({mode:"matrix",preset:"hole",m:2,n:4});check(Math.abs(h.gridMax-Math.SQRT1_2)<1e-14,"grid hole");
    check(createRng(0).uniform()!==createRng(1).uniform(),"seed zero retained");
    return {status:"PASS",checks};
  }
  return {DEFAULTS,PRESETS,QUESTIONS,config,snapshot,evaluate:snapshot,createRng,directionGrid,jacobi,ledgers,plots,svg,fmt,mount,selfTest};
});
