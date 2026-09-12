"""Build static teaching figures exclusively from the supplied stored observations."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.twelve)[0],a.plots(r['one-sample'])[1],a.plots(r.realizable)[2],a.plots(r.noisy)[4],a.plots(r.realizable)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3840" viewBox="0 0 1000 3840" role="img" aria-labelledby="title desc"><title id="title">PAC的概率量词：三点世界，全部训练样本</title><desc id="desc">六面板：默认输入分布和真值表；失败概率与上界；一次训练的全部规则风险；规则被选分布；独立测试二项分布；固定和增长支持集的NFL对照。</desc><rect width="1000" height="3840" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">满分训练集之外，还有哪些可能发生的训练集？</text><text x="40" y="95" font-size="18">A · 默认无噪声分布：每次独立有放回抽一个输入</text>']
for i,(prob,label)in enumerate([('0.4',1),('0.3',0),('0.3',1)]):
 x=180+i*320
 out.append(f'<rect x="{x-115}" y="130" width="230" height="180" rx="15" fill="#e8f0f8" stroke="#3875ba"/><text x="{x}" y="175" text-anchor="middle" font-size="23">输入 x={i}</text><text x="{x}" y="222" text-anchor="middle" font-size="23">概率 {prob}</text><text x="{x}" y="270" text-anchor="middle" font-size="23">真实标签 {label}</text>')
out.append('<text x="40" y="365" font-size="19">八条规则 = 三个格子各填 0 或 1；编号 5 对应 (1,0,1)。</text><text x="40" y="410" font-size="19">ERM 选择训练错误最少者；并列时取编号最小的一条。</text><text x="40" y="455" font-size="19">若某格没见过，默认的最小编号一致规则会在那里填 0。</text><text x="40" y="505" font-size="19">漏见 x=0 或 x=2 ⇒ 风险超过 0.2；两种事件可能同时发生。</text><text x="40" y="555" font-size="22">P(失败) = 0.6ᵐ + 0.7ᵐ − 0.3ᵐ</text><text x="40" y="602" font-size="16">这是固定分布与指定并列规则的精确结果，不能替代分布无关定理。</text>')
labels=['B · 分清每个概率事件：上界为1只表示这条界未提供信息','C · 一次训练能满分，但已选规则仍可能有很大真实风险','D · 默认6点训练：所有可能训练集共同决定被选分布','E · 20%噪声预设：固定已选规则，另抽理想独立32点','F · 每次选择更大支持集，不能偷换成一个固定有限域']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=685+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>')
f=json.loads(fixture.read_text());rows=[]
for rec in f['records']:
 s=rec['data'];e=s['exact'];o=s['observed'];v=[e['events']['failure']['value'],e['events']['uniformFailure']['value'],o['trainingRisk'],o['trueRisk'],o['holdoutRisk']]
 rows.append('| '+rec['key']+' | '+' | '.join(format(x,'.10g')for x in v)+' |')
text='**无脚本对照：**六组固定记录保留全部理想训练计数与一次种子轨迹；二者不混同。\n\n<figure class="plot" markdown="1">\n![三输入真值表、精确失败概率与上界、规则风险和被选概率、独立测试二项分布、NFL支持集对照六面板图。](assets/img/slt-01-pac-ledgers.svg)\n<figcaption>A 是默认无噪声模型。B 展示不同事件和上界的差距。C、D 区分一次训练与所有训练集。E 是条件于已选规则的理想独立测试分布；F 比较固定有限域与随样本量增大的支持集。整数点之间的线只帮助读图。</figcaption>\n</figure>\n\n<div class="pac187-static" role="region" tabindex="0" aria-label="PAC固定记录，可横向滚动" markdown="1">\n\n| 预设 | 精确ERM失败概率 | 统一偏差概率 | 本次训练风险 | 本次规则真实风险 | 本次32点测试风险 |\n|---|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/pac-certificates/run-snapshot.json){download="pac-frozen-records.json"}。包含所有计数行的整数分子、重数与事件、全部规则风险、扫描、uint32轨迹、理想二项分布及64目标NFL见证。小数是显示近似，概率证书中的整数分子与分母可独立核算。\n'
md.write_text(text);print({'panels':6,'rows':6,'bytes':svg.stat().st_size})
