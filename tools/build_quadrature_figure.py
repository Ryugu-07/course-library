"""Exact rational coordinates for the compact-peak counterexample."""
from pathlib import Path
from fractions import Fraction as F
from html import escape

ROOT = Path(__file__).resolve().parents[1]
def peak(x):
    u = 128 * (x - F(39, 64))
    return (1 - u*u)**5 if abs(u) < 1 else F(0)
def path(xs, left, right):
    return " ".join(("M" if i == 0 else "L") + f"{70+660*float((x-left)/(right-left)):.9f},{235-170*float(peak(x)):.9f}" for i,x in enumerate(xs))
parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 710" role="img" aria-labelledby="title desc">',
         '<title id="title">误差估计为零，积分仍为正</title>',
         '<desc id="desc">五个初始探针均落在紧支撑窄峰外。上图为整个单位区间，下图放大已知支撑。函数属于 C4，积分为4/693。</desc>',
         '<rect width="800" height="710" fill="#fff"/>',
         '<g font-family="sans-serif" fill="#172b45">',
         '<text x="50" y="32" font-size="22">五次采样全为零 ≠ 积分为零</text>']
for panel, left, right, offset in [("whole",F(0),F(1),45),("zoom",F(77,128),F(79,128),370)]:
    xs=sorted(set([left+(right-left)*F(i,320) for i in range(321)] + [F(77,128)+F(i,12800) for i in range(201)]))
    xs=[x for x in xs if left<=x<=right]
    parts += [f'<g id="{panel}" transform="translate(0,{offset})" data-left="{float(left)}" data-right="{float(right)}">',
              '<path d="M70 65V235H730" fill="none" stroke="#68798a"/>',
              f'<path class="function" d="{path(xs,left,right)}" fill="none" stroke="#315f9d" stroke-width="3"/>',
              '<text x="48" y="240" font-size="13">0</text><text x="48" y="70" font-size="13">1</text>']
    ticks=[F(0),F(1,4),F(1,2),F(3,4),F(1)] if panel=="whole" else [left,F(39,64),right]
    for x in ticks:
        px=70+660*float((x-left)/(right-left))
        parts += [f'<text x="{px}" y="258" font-size="13" text-anchor="middle">{escape(str(x))}</text>']
        if panel=="whole":
            parts += [f'<circle class="probe" data-x="{float(x)}" cx="{px}" cy="235" r="5" fill="#b64335"/>']
    label="全区间：红点是算法实际读到的五个值" if panel=="whole" else "放大支撑 [77/128,79/128]：蓝线内部一直为正"
    parts += [f'<text x="70" y="22" font-size="17">{label}</text>', '</g>']
parts += ['<text x="50" y="345" font-size="16">S₁ = S₂ = 0，|S₂ − S₁| / 15 = 0，但积分 = 4/693 ≈ 0.005772。</text>',
          '<text x="50" y="688" font-size="15">绘图预先知道峰的位置；普通自适应算法没有得到这条信息。</text></g></svg>']
target=ROOT/"math-course/images/num-04-missed-peak.svg"
target.parent.mkdir(exist_ok=True)
target.write_text("\n".join(parts)+"\n")
print(target.relative_to(ROOT))
