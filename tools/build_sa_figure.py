"""Project stored observations only; never regenerate pseudorandom samples."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.default)[0],a.plots(r.constant)[1],a.plots(r.sparse)[2],a.plots(r.default)[4],a.plots(r.default)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 默认RM：种子轨迹和理想独立模型的均值分别读取','B · 常步长0.15：单位方差噪声下，MSE趋近3/37','C · 稀疏调用：缺失分量保持初值，不能补成解析参考','D · 同一P、同一特征：重加权可破坏平均TD稳定性','E · 16种符号全枚举：独立双估计仅在本等真值例子无偏']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">随机逼近的轨迹、精确矩、访问与投影对照</title><desc id="desc">五面板分别使用固定回放、理想模型矩递推、完整Q表误差、确定性平均TD与16种偏差全枚举。读取同一份六组固定记录。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">每条曲线都写清它能证明什么</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
def fmt(v):return'不适用'if v is None else format(v,'.9g')
for record in f['records']:
 s=record['data'];r=s['rm']['rows'][-1];q=s['q']['rows'][-1];rows.append('| '+record['key']+' | '+str(s['parameters']['steps'])+' | '+fmt(r['theta'])+' | '+fmt(r['mean'])+' | '+fmt(r['mse'])+' | '+fmt(q['error'])+' | '+str(q['covered'])+'/4 |')
text='**无脚本对照：**五图和六行末值读取同一份固定记录。理想模型矩、确定性平均TD与有限种子轨迹分别标注，完整每步与伪随机状态均可下载。\n\n<figure class="plot" markdown="1">\n![RM种子轨迹与均值、常步长均方误差、稀疏Q表误差、重加权平均TD以及16种双估计偏差。](assets/img/mdp-03-sa-ledgers.svg)\n<figcaption>图 mdp-03.1：图B的MSE来自理想独立模型；图D是确定性均值迭代，稳定曲线在同一纵轴上贴近零，精确读数见表；图E是全枚举平均而非一次随机结果。全图线性坐标，零值未抬高。</figcaption>\n</figure>\n\n<div class="sa180-static" role="region" tabindex="0" aria-label="随机逼近固定记录，可横向滚动" markdown="1">\n\n| 预设 | 更新次数 | RM末值 | 理想均值 | 理想MSE | Q解析误差 | 有限覆盖 |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/sa-certificates/run-snapshot.json)。种子回放不验证无穷访问或鞅差假设；γ=1的折现Q参考不适用。每个分量的步长和按实际访问次数计算。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
