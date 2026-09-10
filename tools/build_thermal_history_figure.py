"""Four native plots of separately defined thermal-history mechanisms."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/freezeout-race.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/cosmo-02-thermal-history.svg'
code="const a=require(process.argv[1]),r=a.snapshot(),b=a.snapshot({mode:'bath'}),s=a.snapshot({mode:'saha'});console.log(JSON.stringify([a.plots(r)[0],...a.plots(b),a.plots(s)[0]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 '蓝：Γ/H，橙：比值为1；m=5、n=2、C=1；当前 x=0.5。',
 '蓝：能量自由度 gρ，橙：熵自由度 gs；电子质量阈值处两者不同。',
 '蓝：TD=2 MeV 瞬时解耦模型，橙：(4/11)¹ᐟ³ 极限；当前 Tγ=0.1 MeV。',
 '蓝：自由电子分数，橙：中性氢分数；η=6×10⁻¹⁰；当前 kBT=0.3 eV。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">热历史：速率、熵与平衡组成</title><desc id="desc">四幅可核算的机制曲线，全部节点在交互账本中。各横轴向右升温，冷却向左走。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">温度降低时，逐项核对谁还在交换能量</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="18">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">平衡分数不是最后散射概率；本图不输出元素丰度或精密宇宙学参数。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
