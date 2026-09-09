"""Deterministic, code-native transition diagrams for the three teaching chains."""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
out = ['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="820" viewBox="0 0 1100 820" role="img" aria-labelledby="title desc">',
       '<title id="title">三种 Markov 链：正概率转移、互通类与初态</title>',
       '<desc id="desc">三行依次为二状态非周期链、二状态互换链和三状态吸收链。箭头标记真实一步概率，右侧给出相同矩阵的精确分布公式。</desc>',
       '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#315f9d"/></marker></defs>',
       '<rect width="1100" height="820" fill="#faf8f3"/>',
       '<g font-family="Arial, PingFang SC, sans-serif" fill="#243344">']

def text(x,y,value,size=18,color="#243344",anchor="start"):
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}">{escape(value)}</text>')

def node(x,y,i,closed=False):
    if closed: out.append(f'<circle cx="{x}" cy="{y}" r="34" fill="none" stroke="#39734d" stroke-width="2"/>')
    out.append(f'<circle cx="{x}" cy="{y}" r="28" fill="#fff" stroke="#315f9d" stroke-width="2"/>')
    text(x,y+7,str(i),22,anchor="middle")

def edge(d,label,x,y,frm,to,prob):
    out.append(f'<path d="{d}" fill="none" stroke="#315f9d" stroke-width="2.5" marker-end="url(#arrow)" data-from="{frm}" data-to="{to}" data-probability="{prob}"/>')
    text(x,y,label,18,"#315f9d","middle")

text(36,38,"相同的矩阵，逐项核对结构与长期行为",25)
text(36,68,"状态编号从 0 开始；蓝箭头标出全部正概率转移；绿色外框标出闭类。",17,"#52616e")
for y in [90,323,544]:
    out.append(f'<line x1="32" y1="{y}" x2="1068" y2="{y}" stroke="#ccd2d6"/>')

out.append('<g data-preset="mixing">')
text(36,122,"A · 不可约，非周期",20)
out.append('<rect x="68" y="143" width="344" height="124" rx="48" fill="none" stroke="#39734d" stroke-width="2"/>')
node(150,204,0);node(330,204,1)
edge("M178 191 Q240 151 301 191","0.2",240,161,0,1,.2)
edge("M302 218 Q240 258 179 218","0.3",240,256,1,0,.3)
edge("M129 185 C72 115 67 271 126 226","0.8",78,206,0,0,.8)
edge("M351 225 C412 285 414 118 354 183","0.7",402,206,1,1,.7)
text(36,298,"一个闭互通类 {0,1}；自环 ⇒ d=1",17,"#39734d")
text(480,155,"π = (0.6, 0.4)；特征值 1 与 0.5",20)
text(480,191,"δ₀ Pⁿ = (0.6 + 0.4·2⁻ⁿ, 0.4 − 0.4·2⁻ⁿ)")
text(480,226,"TV：从 δ₀ 出发为 0.4·2⁻ⁿ；从 δ₁ 为 0.6·2⁻ⁿ")
text(480,261,"从 π 出发：每一步都仍是 π，TV = 0")
text(480,295,"有限 + 不可约 + 非周期 ⇒ 任意初态趋向唯一 π",17,"#52616e")
out.append('</g><g data-preset="periodic">')
text(36,354,"B · 不可约，周期为 2",20)
out.append('<rect x="80" y="375" width="320" height="108" rx="46" fill="none" stroke="#39734d" stroke-width="2"/>')
node(150,430,0);node(330,430,1)
edge("M178 417 Q240 377 301 417","1",240,387,0,1,1)
edge("M302 444 Q240 484 179 444","1",240,482,1,0,1)
text(36,520,"一个闭互通类；只能在偶数正步数返回",17,"#39734d")
text(480,389,"π = (1/2, 1/2)；特征值 1 与 −1",20)
text(480,425,"δ₀ P²ᵏ = δ₀；δ₀ P²ᵏ⁺¹ = δ₁")
text(480,460,"从点质量出发 TV = 1/2，一直不衰减")
text(480,495,"从 π 出发仍然平稳；周期不等于所有初态都振荡")
text(480,525,"前 M 步分布的 Cesàro 平均仍趋向 π",17,"#52616e")
out.append('</g><g data-preset="reducible">')
text(36,575,"C · 可约，两个吸收闭类",20)
node(140,656,0,True);node(340,656,1,True);node(240,752,2)
edge("M119 637 C56 570 57 722 116 678","1",66,655,0,0,1)
edge("M361 677 C424 741 426 571 364 635","1",413,655,1,1,1)
edge("M219 733 L164 679","1/2",179,718,2,0,.5)
edge("M261 733 L316 679","1/2",303,718,2,1,.5)
text(36,801,"{0}、{1}：正常返；{2}：瞬过，无正时间返回",17,"#39734d")
text(480,612,"πₐ = (a, 1−a, 0)，0 ≤ a ≤ 1",20)
text(480,649,"δ₀、δ₁ 各自永远留在自己的吸收类")
text(480,686,"δ₂ Pⁿ = (1/2, 1/2, 0)，n ≥ 1")
text(480,723,"实验选 π₁/₂ 作参照；其他 πₐ 也都平稳")
text(480,760,"TV 到某个所选 π 不趋 0，不代表分布没有极限")
text(480,797,"先辨闭类，再问初始质量流向哪里",17,"#52616e")
out.append('</g></g></svg>')
(ROOT/'math-course/images/stoch-02-markov-converge.svg').write_text('\n'.join(out)+'\n')
print('Built Markov structure SVG')
