"""Pair the same normal samples across three interval rules."""
from pathlib import Path
from html import escape
import json,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
def build():
 data=json.loads((ROOT/'tools/fixtures/confidence-reference.json').read_text());rows=data['samples'];xmin=min(r['center']-max(r['z'],r['t'])for r in rows)-1;xmax=max(r['center']+max(r['z'],r['t'])for r in rows)+1
 s=['<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="900" viewBox="0 0 1080 900" role="img" aria-labelledby="title desc">','<title id="title">Paired confidence intervals and theoretical selection coverage</title><desc id="desc">The same 24 samples produce z, t, and narrower-selected intervals. Lower panel shows exact-rule coverage computed by numerical quadrature.</desc>','<rect width="1080" height="900" fill="#faf7ef"/>']
 def text(x,y,v,size=14,anchor='start',color='#25251f'):s.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}" font-family="Arial,sans-serif">{escape(str(v))}</text>')
 text(30,32,'Same samples, different reporting rules',22);text(30,60,'Normal population: mean 500 ml, SD 8 ml; n=16; 95% nominal; 24 independent samples.')
 for panel,key in enumerate(['z','t','selected']):
  left=65+350*panel;width=285;top=110;bottom=510
  def sx(v):return left+width*(v-xmin)/(xmax-xmin)
  text(left,90,{'z':'Known SD: z interval','t':'Studentized: t interval','selected':'Choose the narrower one'}[key],16)
  for i in range(5):
   x=left+width*i/4;v=xmin+(xmax-xmin)*i/4;s.append(f'<path d="M{x},{top}V{bottom}" fill="none" stroke="#dedad3"/>');text(x,bottom+22,f'{v:.1f}',12,'middle')
  s.append(f'<path d="M{sx(500)},{top}V{bottom}" stroke="#9b6a12" stroke-dasharray="5 4"/>')
  covered=0
  for i,r in enumerate(rows):
   lo=r['center']-r[key];hi=r['center']+r[key];hit=lo<=500<=hi;covered+=hit;y=top+10+16*i;color='#39734d'if hit else'#b64335'
   s.append(f'<path data-interval="{key}-{i}" d="M{sx(lo):.7f},{y}H{sx(hi):.7f}" stroke="{color}" stroke-width="2.2"/>');s.append(f'<circle cx="{sx(r["center"]):.7f}" cy="{y}" r="2.6" fill="{color}"/>');text(left-8,y+4,i+1,11,'end')
  text(left,bottom+47,f'Observed coverage: {covered}/24',14);text(left,bottom+69,'Horizontal axis: endpoints (ml)',13)
 left=80;top=650;width=900;height=170;bottom=820
 text(30,618,'Theory for the whole selection rule; nominal confidence remains 95%',17)
 for n in [2,16,30,45,60]:
  x=left+width*(n-2)/58;s.append(f'<path d="M{x},{top}V{bottom}" stroke="#dedad3"/>');text(x,bottom+23,n,13,'middle')
 for c in [.9,.92,.94,.96]:
  y=bottom-height*(c-.9)/.06;s.append(f'<path d="M{left},{y}H{left+width}" stroke="#dedad3"/>');text(left-10,y+4,f'{100*c:.0f}%',13,'end')
 y=bottom-height*(.95-.9)/.06;s.append(f'<path d="M{left},{y}H{left+width}" stroke="#9b6a12" stroke-dasharray="6 4"/>')
 points=[(left+width*(r['n']-2)/58,bottom-height*(r['coverage']-.9)/.06)for r in data['selection']if r['c']==.95];assert all(top<=y<=bottom for x,y in points)
 d=' '.join(('M'if i==0 else'L')+f'{x:.7f},{y:.7f}'for i,(x,y)in enumerate(points));s.append(f'<path data-coverage="selected" d="{d}" fill="none" stroke="#315f9d" stroke-width="2.5"/>');text(530,883,'Sample size n; the blue curve is theory, not the finite-sample count above.',14,'middle')
 s.append('</svg>');output='\n'.join(s);ET.fromstring(output);p=ROOT/'math-course/images/stat-03-confidence.svg';p.write_text(output);print(p)
if __name__=='__main__':build()
