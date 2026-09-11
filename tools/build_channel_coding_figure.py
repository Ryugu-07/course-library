"""Render complete fixed channel runs; never resample numeric fixture during publication."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/channel-coding.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/it2-02-channel-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/channel-coding/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.even)[0],a.plots(f.tail)[0],a.plots(f.exercise)[3],a.plots(f.ensemble)[3]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=[
 '四位重复码，p=0.1，平局优先0：蓝=各消息错误，橙=平均0.028，玫红=最大0.0523。',
 'n=500，p=0.1，带宽0.02：蓝=真实距离，橙=假距离，绿=接受质量；真尾项约0.602。',
 'n=3，p=0.1，M=2，带宽0.5：紫点依次为0.271、0.125、0.396、0.396。',
 'n=3均匀随机造码，p=0.1：紫=距离d的ML错误；d=0碰撞，错误0.5。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">有限信道编码的完整错误账本</title><desc id="desc">平局的逐消息影响、真假配对的不同分布、有限并集界和随机码本距离公式。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">具体码本错多少，容量证明又说了什么？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；交互由当前浏览器重新计算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());e=f['even']['result'];t=f['tail']['result'];x=f['exercise']['result'];g=f['ensemble']['result']
 rows=[('四位优先0：消息0错误',e['perMessage'][0]['error']['value']),('四位优先0：消息1错误',e['perMessage'][1]['error']['value']),('四位平均块错误',e['averageError']['value']),('四位最大消息错误',e['maximumError']['value']),('四位重复码率',e['rate']),('BSC(0.1)容量',e['capacity']),('500位真配对尾项',t['trueTail']['value']),('500位假消息并集项',t['falseTerm']['value']),('500位有限并集原始和',t['rawUnion']['value']),('三位例真配对尾项',x['trueTail']['value']),('三位例一个假接受率',x['falseAccepted']['value']),('三位例并集上界',x['cappedUnion']['value']),('三位唯一典型译码实际平均',1-(.9**3)*(7/8)),('三位随机码本ML平均',g['averageError']['value']),('三位随机码本碰撞概率',g['collisionProbability']['value']),('三位支持中最小ML错误',g['bestSupportedError']['value']),('三位支持中最大ML错误',g['worstSupportedError']['value']),('三位正概率有序码本数',g['supportCount'])]
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部接收词、混淆矩阵、类型和随机码本](assets/learning/projects/channel-coding/run-snapshot.json)。四位例码本0000、1111，消息均匀，p=0.1，ML且平局优先首标签；500位例M=2^200、p=0.1、带宽0.02；三位典型例M=2、p=0.1、带宽0.5；随机码本例n=3、每位P(1)=1/2、p=0.1、两条独立码字、均匀消息与ML。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+format(value,'.12g')+' |\n'for label,value in rows)
 table+='\n图线连接离散点只作读图辅助，重合曲线可互相覆盖。概率精确值以分子、分母为准；熵与对数为浮点近似，选带不是严格区间证书。并集上界不等于实际错误；随机码本平均不等于每个成员。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(rows))
