# -*- coding: utf-8 -*-
"""Render supplied product-sweep observations without regenerating them."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]);const jobs=[['default',0],['fixed',1],['certified',2],['jacobi',3],['hidden',4],['hidden',5],['default',6]];console.log(JSON.stringify(jobs.map(([k,i])=>a.svg(a.plots(f.records.find(r=>r.key===k).data)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4730" viewBox="0 0 1000 4730" role="img" aria-labelledby="title desc"><title id="title">四自旋完整扫描的下降与误差证书</title><desc id="desc">实际调度、局部残差、量子方差、内部键修正、联合Hessian和多初值分别检查。</desc><rect width="1000" height="4730" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">每个局部题都做对，还需检查完整物理问题</text>']
names=['A · 相同局部求解次数，三种调度的真实能量不同','B · 全Z固定点的局部残差精确为零，不能据此宣布基态','C · g=1.7有乘积态最优证明，完整量子方差仍为3','D · 同步反例：预测下降−4，交叉修正+6，实际升高2','E · 四个联合本征方向，统一扰动不是最危险方向','F · g=1.6：比较有限幅度的真实变化与二阶预测','G · 多初值可以检查路径，却不是全局最优证明']
for i,(panel,name)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>');out.append(panel.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4688" font-size="16">四站开放链，三条XX键，Pauli±1，J=1；chi=1变分分岔不是量子相变。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return'不适用'if x is None else'是'if x is True else'否'if x is False else format(x,'.9g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];q=s['selected'];name={'default':'默认两轮','fixed':'零局部残差','jacobi':'同步反例','hidden':'隐藏下降方向','certified':'乘积全局证书','long':'十二轮扫描'}[r['key']];v=[name,s['model']['g'],q['rounds'],['依次单点','四点同步','不相邻分组'][q['method']],q['final']['energy'],q['final']['localResidual'],q['final']['variance'],q['maxBatchRise'],s['hessian']['minimum'],s['hessian']['productGlobalCertificate']];rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份固定记录保留三种调度的全部批次、每次局部矩阵、完整量子态与所有扫描。下面的结束值对应所列调度，完整下载同时包含其余调度。\n\n<div class="sweeps212-static" role="region" tabindex="0" aria-label="乘积态扫描固定记录，可横向滚动" markdown="1">\n\n| 预设 | g | 轮数 | 当前调度 | 结束能量 | 局部残差 | 量子方差 | 最大批次上升 | 最低联合曲率 | 乘积全局证书 |\n|---|---:|---:|---|---:|---:|---:|---:|---:|---|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/sweeps-certificates/run-snapshot.json){download="sweeps-frozen-records.json"}，含全部16维态、Hamiltonian、每次局部解、内部键修正和联合方向。\n'
md.write_text(text,encoding='utf-8');print({'plots':7,'rows':6,'bytes':svg.stat().st_size})
