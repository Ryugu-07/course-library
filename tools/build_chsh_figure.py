"""Draw supplied observations; never regenerate any sample or theoretical scan."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.quantum)[1],a.plots(r.one)[1],a.plots(r.classical)[2],a.plots(r.entangled)[4],a.plots(r.entangled)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 理论与样本分开：估计值可以超出量子期望界','B · 四个设置各一对：保留样本−4，不把它截到−2√2','C · 局域模型前缀：区间收窄，每个区间的保证有固定样本量前提','D · 独立Werner族：负的部分转置本征值检出纠缠','E · 独立Werner族：最大自旋CHSH超过2需要更高可见度']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">从计数到Bell关联的不同证据</title><desc id="desc">五幅图读取六组给定记录，样本原值、理论界、有限样本区间和纠缠判据分别绘制。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">同样的关联，怎样给出可信的说明</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
def fmt(v):return'未定义'if v is None else '['+', '.join(fmt(x)for x in v)+']'if isinstance(v,list)else format(v,'.9g')
names={'quantum':'singlet最优角','classical':'局域模型','one':'每设置一对','zero':'没有观测','entangled':'纠缠但无自旋CHSH违反','separable':'Werner可分边界'}
for r in f['records']:
 s=r['data'];c=s['parameters'];rows.append('| '+names[r['key']]+' | '+str(c['shots'])+' | '+fmt(c['visibility'])+' | '+fmt(s['modelS'])+' | '+fmt(s['sample']['estimate'])+' | '+fmt(s['sample']['physicalInterval'])+' |')
text='**无脚本对照：**五幅图读取下表同一份六组记录。样本的代数范围是[-4,4]，并不被截到理论量子界。区间保证需要正文列出的固定、独立抽样条件。\n\n<figure class="plot" markdown="1">\n![CHSH理论与样本、单次极端读数、有限样本区间以及Werner纠缠和CHSH阈值。](assets/img/qi-01-chsh-ledgers.svg)\n<figcaption>图 qi-01.1：A与B区分期望与估计；C显示抽样不确定性；D与E区分纠缠和特定Bell检验。</figcaption>\n</figure>\n\n<div class="chsh175-static" role="region" tabindex="0" aria-label="CHSH固定观察，可横向滚动" markdown="1">\n\n| 预设 | 每设置n | 参照v | 本模型理论S | 样本Ŝ | Hoeffding区间与[-4,4]相交 |\n|---|---:|---:|---:|---:|---|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整固定记录](assets/learning/projects/chsh-certificates/run-snapshot.json)。包含每一对的伪随机状态、结果、完整计数、区间和矩阵；经典模型的v只属于独立Werner参照。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
