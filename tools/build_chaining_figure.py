"""Native complete tree, expectation/sample distinction and covering staircase."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/chaining-tree.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/hdp-04-chaining-ledgers.svg'
code="""const a=require(process.argv[1]),d=a.snapshot(),n=a.snapshot({depth:1,seed:3});console.log(JSON.stringify({svgs:[a.tree(d),a.svg(a.plots(d)[1]),a.svg(a.plots(d)[2]),a.svg(a.plots(n)[1])]}))"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 '默认K=5、a=0.86、ρ=0.42、seed=31031；金线是当前最大叶的完整路径。',
 '编号1–6：样本max、样本链上界、单/多尺度期望界、单/多尺度高概率界。',
 '按共同前缀精确计数；实心端包含、空心端不含。面积I≈1.40130，常数C未指定。',
 'K=1、seed=3：前两项约−0.456709；负的观测值没有被裁成0。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2320" viewBox="0 0 1000 2320" role="img" aria-labelledby="title desc"><title id="title">Chaining：完整路径、量词与覆盖阶梯</title><desc id="desc">完整二叉树与四种不同含义的界，精确覆盖阶梯，以及负最大值的确定种子反例。所有节点均可在正文账本复算。</desc><rect width="1000" height="2320" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">共同祖先怎样变成概率几何？</text>']
for svg,y,note,ny in zip(data['svgs'],[90,765,1275,1795],notes,[700,1225,1735,2260]):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{ny}" font-size="18">{html.escape(note)}</text>')
out.append('<text x="35" y="2300" font-size="18">真实高斯模型的理论界与固定伪随机样本分开解释；详见正文的完整证明和六张账本。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
