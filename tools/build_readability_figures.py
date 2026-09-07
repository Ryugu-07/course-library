#!/usr/bin/env python3
"""Build the three native SVG teaching bridges; no external dependencies."""
from pathlib import Path
from math import sin, cos, pi
from html import escape

ROOT = Path(__file__).resolve().parents[1]
BLUE, GOLD, INK = "#27689b", "#a46615", "#243746"


def text(x, y, value, size=21, color=INK, anchor="start"):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}">{escape(value)}</text>'


def line(x1, y1, x2, y2, color=INK, dash="", arrow=False):
    return f'<path d="M{x1},{y1}L{x2},{y2}" fill="none" stroke="{color}" stroke-width="2.5" stroke-dasharray="{dash}"' + (' marker-end="url(#arrow)"' if arrow else '') + '/>'


def save(course, filename, height, title, desc, body):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 {height}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title><desc id="desc">{escape(desc)}</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>
<rect width="560" height="{height}" rx="12" fill="#faf9f5"/>
<g font-family="system-ui, sans-serif">{body}</g></svg>'''
    target = ROOT / course / "images" / filename
    target.write_text(svg + "\n")


def weak_solution():
    def xy(x, u):
        return 70 + 420*x, 260 - 1280*u
    points = " ".join(f"{xy(i/100, (i/100)*(1-i/100)/2)[0]:.2f},{xy(i/100, (i/100)*(1-i/100)/2)[1]:.2f}" for i in range(101))
    body = text(28, 35, "先有一个系数，再增加更多形状", 23)
    body += line(70, 260, 515, 260, arrow=True) + line(70, 260, 70, 66, arrow=True)
    body += line(70, 100, 280, 100, "#a6adb3", "5 5")
    body += f'<polyline points="{points}" fill="none" stroke="{BLUE}" stroke-width="4"/>'
    body += f'<path d="M70 260L280 100L490 260" fill="none" stroke="{GOLD}" stroke-width="3" stroke-dasharray="9 6"/>'
    body += text(37, 108, "⅛") + text(62, 285, "0") + text(280, 285, "½", anchor="middle") + text(490, 285, "1", anchor="middle") + text(522, 265, "x")
    body += text(315, 92, "u=x(1−x)/2", 21, BLUE) + text(322, 224, "uₕ=⅛ φ", 21, GOLD)
    body += text(28, 327, "实线：精确解　虚线：单帽函数近似", 21)
    save("grad-math", "elliptic-weak-bridge.svg", 350, "弱解与帽函数近似", "精确抛物线和帽函数近似都在端点为零、中点为八分之一。帽函数中点有折角。", body)


def pendulum():
    ox, oy, length, angle = 185, 80, 215, pi/5
    bx, by = ox + length*sin(angle), oy + length*cos(angle)
    body = text(28, 35, "约束 x²+y²=l² → 一个角度 θ", 23)
    body += line(125, 80, 245, 80) + line(ox, oy, ox, 325, "#89939b", "5 5")
    body += line(ox, oy, bx, by, BLUE)
    body += f'<path d="M185 142 A62 62 0 0 0 {ox+62*sin(angle):.2f} {oy+62*cos(angle):.2f}" fill="none" stroke="{GOLD}" stroke-width="3"/>'
    body += f'<circle cx="{bx}" cy="{by}" r="12" fill="{BLUE}"/>'
    body += line(bx, by, bx, by+95, GOLD, arrow=True)
    body += line(bx, by, bx+95*cos(angle), by-95*sin(angle), BLUE, arrow=True)
    body += text(208, 139, "θ", 24, GOLD) + text(246, 168, "l", 25, BLUE)
    body += text(330, 332, "mg", 23, GOLD) + text(385, 187, "允许位移", 21, BLUE)
    body += text(328, 263, "m") + text(95, 322, "竖直向下", 18)
    body += line(52, 126, 108, 126, arrow=True) + line(52, 126, 52, 74, arrow=True)
    body += text(111, 135, "x", 18) + text(42, 67, "y", 18)
    body += text(28, 397, "x=l sinθ，y=−l cosθ", 23)
    save("physics-course", "lagrange-pendulum-bridge.svg", 423, "理想单摆的广义坐标", "θ 从竖直向下量起。y轴向上。重力向下，允许位移沿圆周切线，与杆垂直。", body)


def capacitor():
    body = text(24, 34, "同一边界 C，两种跨面", 23)
    for shift, curved in [(0, False), (260, True)]:
        body += f'<g transform="translate(0 {shift})">'
        if curved:
            body += '<path d="M200 85C255 42 378 42 425 85Q456 135 425 185C378 228 255 228 200 185Q220 135 200 85Z" fill="#f1dfb9" fill-opacity=".55" stroke="#a46615" stroke-width="2" stroke-dasharray="6 5"/>'
        else:
            body += '<ellipse cx="200" cy="135" rx="20" ry="50" fill="#d9e8f2"/>'
        body += line(55, 135, 390, 135) + line(465, 135, 522, 135)
        body += line(390, 79, 390, 191, BLUE) + line(465, 79, 465, 191, BLUE)
        body += line(75, 115, 126, 115, INK, arrow=True) + text(80, 98, "I")
        body += '<ellipse cx="200" cy="135" rx="20" ry="50" fill="none" stroke="#27689b" stroke-width="3"/>'
        body += text(170, 72, "C", 23, BLUE)
        body += text(400, 110, "+", 20, BLUE) + text(444, 110, "−", 20, BLUE)
        body += line(403, 157, 451, 157, GOLD, arrow=True) + text(424, 185, "E", 19, GOLD)
        body += text(25, 244 if curved else 222, "S₂：板间传导 0；位移项 Iᵈ=I" if curved else "S₁：穿过导线，传导电流 I", 21)
        body += '</g>'
    body += text(24, 554, "曲面形状示意；忽略边缘场与漏电", 21)
    save("physics-course", "maxwell-capacitor-bridge.svg", 580, "电容充电的两张跨面", "上图平面穿导线，下图曲面绕过左极板进入间隙，两面的边界是同一曲线C。传导与位移项之和相同。", body)


if __name__ == "__main__":
    weak_solution()
    pendulum()
    capacitor()
    print("Built 3 readability bridge SVGs")
