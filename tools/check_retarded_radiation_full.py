from pathlib import Path
import json,subprocess,tempfile,shutil,sys
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
STAGING='--staging'in sys.argv
ROOT=Path(__file__).resolve().parents[1]
JS=ROOT/('work/radiation165.js'if STAGING else'course-shared/labs/retarded-radiation.js')
FIXTURE=ROOT/('work/radiation-snapshot165.json'if STAGING else'course-shared/projects/retarded-radiation/run-snapshot.json')
NODE="const fs=require('fs'),assert=require('assert'),a=require(require('path').resolve(process.argv[2])),states=a.PRESETS.map(p=>a.snapshot(p.values));\nfor(const waveform of ['harmonic','pulse'])for(const amplitude of ['-2','0','2'])for(const i of[0,1,2])states.push(a.snapshot({waveform,amplitude,omega:i===0?'0':i===1?'4':'0.0001',duration:i===0?'0.5':'4',start:i===1?'-2':'2',time:i===0?'24':i===1?'-4':'3',radius:i===0?'0.1':'8',angle:i===0?'0':i===1?'90':'180',speed:i===0?'0.5':'2'}));\nlet invalid=0;const bads=[null,[],true,0,'',{extra:'1'}];for(const k of Object.keys(a.DEFAULTS))for(const v of [null,undefined,[],{},1,Infinity])bads.push({[k]:v});for(const[k,vs]of Object.entries({waveform:['Pulse','static',''],amplitude:['-2.1','2.1','+1','1e0','01'],omega:['-1','4.1','1e0','NaN'],duration:['0','0.49','4.1'],start:['-2.1','2.1'],time:['-4.1','24.1','Infinity'],radius:['0','-1','0.09','8.1'],angle:['-1','180.1','1e0'],speed:['0','0.49','2.1']}))for(const v of vs)bads.push({[k]:v});for(const v of bads){assert.throws(()=>a.snapshot(v));invalid++;}\nconst canonical=JSON.stringify(a.snapshot());for(const mutate of [d=>d.point.source.p=99,d=>d.power.rows[0].field.components.et=99,d=>d.timeSeries[0].field.source.p=99,d=>d.averages[0].rows[0].angularNodes[0].field.source.p=99]){const x=a.snapshot();mutate(x);assert.equal(JSON.stringify(a.snapshot()),canonical);}\nfunction close(x,y){assert(Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<1e-10*(1+Math.abs(y)));}\nlet invariance=0;for(const waveform of ['harmonic','pulse']){const x=a.snapshot({waveform,amplitude:'1',time:'2'}),y=a.snapshot({waveform,amplitude:'-2',time:'2'});for(const k of Object.keys(x.point.components))close(y.point.components[k],-2*x.point.components[k]);for(const k of Object.keys(x.point.flux))close(y.point.flux[k],4*x.point.flux[k]);close(y.point.energyDensity,4*x.point.energyDensity);invariance++;}\nfor(const [left,right]of [[{omega:'0',time:'-4'},{omega:'0',time:'24'}],[{waveform:'pulse',omega:'0'},{waveform:'pulse',omega:'4'}],[{duration:'0.5'},{duration:'4'}]]){const x=a.snapshot(left),y=a.snapshot(right);assert.deepEqual(x.point.components,y.point.components);assert.deepEqual(x.point.flux,y.point.flux);invariance++;}\nfunction compare(x,y){if(typeof x==='number'&&typeof y==='number'){close(x,y);return;}if(x&&y&&typeof x==='object'&&typeof y==='object'){assert.deepEqual(Object.keys(x),Object.keys(y));for(const k of Object.keys(x))compare(x[k],y[k]);return;}assert.strictEqual(x,y);}\nlet frozen=0;if(process.argv[3]!=='-'){const f=JSON.parse(fs.readFileSync(process.argv[3]));for(const k of ['return','pulse','front','static']){compare(a.snapshot(f[k].parameters),f[k]);states.push(f[k]);frozen++;}}\nconst views=states.map(s=>{const p=a.plots(s),tables=a.ledgers(s);return{plots:p,svgs:p.map(a.svg),tables,formatted:tables.map(t=>t.rows.map(r=>r.map(a.fmt)))};});fs.writeFileSync(process.argv[4],JSON.stringify({states,views,live:states.length-frozen,frozen,invalid,mutationGuards:4,invariance,self:a.selfTest()}));\n"
with tempfile.TemporaryDirectory()as td:
 script=Path(td)/'export.cjs';out=Path(td)/'bundle.json';script.write_text(NODE)
 subprocess.run(PREFIX+['node',str(script),str(JS),str(FIXTURE),str(out)],check=True)
 bundle=json.loads(out.read_text())

import math
from fractions import Fraction
checks=0
def ck(v,msg='assertion'):
 global checks
 checks+=1
 if not v:raise AssertionError(msg)
def close(a,b,msg='number',tol=2e-10):ck(math.isfinite(a)and math.isfinite(b)and abs(a-b)<=tol*(1+abs(b)),msg+str((a,b)))
COEFFICIENTS=[0,0,0,0,256,-1024,1536,-1024,256]
SECOND=[COEFFICIENTS[n]*n*(n-1)for n in range(2,9)]
SQUARED=[sum(SECOND[i]*SECOND[n-i]for i in range(len(SECOND))if 0<=n-i<len(SECOND))for n in range(13)]
def bernstein(n,k,x):return math.comb(n,k)*x**k*(1-x)**(n-k)if 0<=k<=n else 0
def waveform(c,tau):
 A=float(c['amplitude']);w=float(c['omega']);D=float(c['duration']);start=float(c['start'])
 if c['waveform']=='harmonic':return[A*math.cos(w*tau+n*math.pi/2)*w**n for n in range(4)]
 x=(tau-start)/D
 if not 0<x<1:return[0]*4
 # f=(256/70)B_4^8. Differentiate the Bernstein basis instead of the live factored expressions.
 return[A*256/70*math.factorial(8)/math.factorial(8-n)/D**n*math.fsum((-1)**(n-j)*math.comb(n,j)*bernstein(8-n,4-j,x)for j in range(n+1))for n in range(4)]
def components(c,r,theta,t):
 speed=float(c['speed']);p,p1,p2,p3=waveform(c,t-r/speed);sn=math.sin(theta);cs=math.cos(theta);q=1/(4*math.pi);mu=4*math.pi/speed**2
 er=2*cs*(p/r**3+p1/(speed*r*r));et=sn*(p/r**3+p1/(speed*r*r)+p2/(speed*speed*r));bb=sn*(p1/(speed**2*r*r)+p2/(speed**3*r));return er,et,bb,et*bb/mu,-er*bb/mu,(q*(er*er+et*et)+bb*bb/mu)/2
def check_field(c,f):
 r,theta,t=f['radius'],f['theta'],f['time'];speed=float(c['speed']);tau=t-r/speed;close(f['retardedTime'],tau);vals=waveform(c,tau)
 for k,v in zip(['p','first','second','third'],vals):close(f['source'][k],v,k,2e-9)
 p,p1,p2,p3=vals;sn=math.sin(theta);cs=math.cos(theta)
 for key,v in [('erNear',2*cs*p/r**3),('erInduction',2*cs*p1/(speed*r*r)),('etNear',sn*p/r**3),('etInduction',sn*p1/(speed*r*r)),('etRadiation',sn*p2/(speed*speed*r)),('bInduction',sn*p1/(speed*speed*r*r)),('bRadiation',sn*p2/(speed**3*r))]:close(f['components'][key],v,key,3e-9)
 for key,v in [('near',p/r**3),('induction',p1/(speed*r*r)),('radiation',p2/(speed*speed*r))]:close(f['scales'][key],v,key)
 close(f['angular']['sin'],sn);close(f['angular']['cos'],cs);close(f['source']['time'],tau)
 if c['waveform']=='harmonic':ck(f['source']['normalizedTime']is None);ck(f['source']['active']is True);close(f['source']['phase'],float(c['omega'])*tau)
 else:
  u=(tau-float(c['start']))/float(c['duration']);close(f['source']['normalizedTime'],u);ck(f['source']['active']==(0<u<1));ck(f['source']['phase']is None)
 close(f['flux']['radiationRadial'],f['components']['etRadiation']*f['components']['bRadiation']/(4*math.pi/speed**2));close(f['flux']['radiationDifferentialPower'],r*r*f['flux']['radiationRadial'])
 er,et,bb,sr,st,ud=components(c,r,theta,t)
 for k,v in [('er',er),('et',et),('b',bb)]:close(f['components'][k],v,k,3e-9)
 for k,v in [('radial',sr),('polar',st),('differentialPower',r*r*sr)]:close(f['flux'][k],v,k,3e-9)
 close(f['energyDensity'],ud,'energy',4e-9);close(f['potential'],math.cos(theta)*(vals[0]/r**2+vals[1]/(speed*r)));close(f['az'],vals[1]/(speed*speed*r));close(f['cartesian']['x'],er*math.sin(theta)+et*math.cos(theta));close(f['cartesian']['z'],er*math.cos(theta)-et*math.sin(theta));close(f['cartesian']['by'],bb)
 c0=f['components'];close(c0['er'],c0['erNear']+c0['erInduction']);close(c0['et'],sum(c0[k]for k in ['etNear','etInduction','etRadiation']));close(c0['b'],c0['bInduction']+c0['bRadiation']);close(c0['etRadiation']/speed,c0['bRadiation']);ck(f['energyDensity']>=0)
def check_power(c,p):
 r,t=p['radius'],p['time'];speed=float(c['speed']);h=waveform(c,t-r/speed);reference=8*math.pi/3*r*r*components(c,r,math.pi/2,t)[3];close(p['closed'],reference,'full angular flux',3e-9);close(p['radiation'],2*h[2]**2/(3*speed**3));close(p['reactive'],p['closed']-p['radiation']);close(p['reactivePrimitive'],2/3*(h[1]**2/(speed*speed*r)+h[0]*h[1]/(speed*r*r)+h[0]**2/(2*r**3)))
 for key,v in [('cross',4*h[1]*h[2]/(3*speed*speed*r)),('induction',2*(h[1]*h[1]+h[0]*h[2])/(3*speed*r*r)),('near',2*h[0]*h[1]/(3*r**3))]:close(p['terms'][key],v,key)
def check_state(s):
 ck(s['version']==165);ck(len(s['angles'])==65 and len(s['timeSeries'])>=129 and len(s['radiusScan'])==49 and len(s['power']['rows'])==33);ck(len(s['averages'])==(8 if s['parameters']['waveform']=='harmonic'else 0))
 check_sampling(s)
 c=s['parameters'];check_field(c,s['point']);check_power(c,s['power']);close(s['power']['numerical'],s['power']['closed'],'sphere Simpson',2e-9)
 for r in s['power']['rows']:check_field(c,r['field']);close(r['integrand'],2*math.pi*s['power']['radius']**2*r['field']['flux']['radial']);close(r['contribution'],2/32/3*r['weight']*r['integrand'])
 close(s['power']['numerical'],math.fsum(r['contribution']for r in s['power']['rows']))
 for j,row in enumerate(s['power']['rows']):close(row['index'],j);close(row['u'],-1+j/16);close(row['theta'],math.acos(row['u']));close(row['weight'],1 if j in[0,32]else 4 if j%2 else 2)
 close(s['units']['k'],1);close(s['units']['epsilon0'],1/(4*math.pi));close(s['units']['mu0'],4*math.pi/float(c['speed'])**2);close(s['units']['speed'],float(c['speed']))
 close(s['point']['radius'],float(c['radius']));close(s['point']['theta'],float(c['angle'])*math.pi/180);close(s['point']['time'],float(c['time']));close(s['power']['residual'],s['power']['numerical']-s['power']['closed'])
 for j,event in enumerate(s['events']):
  distance=[1,2,4,float(c['radius'])][j];delay=distance/float(c['speed']);arrival=float(c['start'])+delay;close(event['distance'],distance);close(event['travelTime'],delay);close(event['sourceStart'],float(c['start']));close(event['arrival'],arrival);close(event['retardedTime'],float(c['time'])-delay);ck(event['frontArrived']==(float(c['time'])>=arrival))
 for j,row in enumerate(s['angles']):close(row['theta'],math.pi*j/64)
 for j,row in enumerate(s['radiusScan']):close(row['radius'],.1*80**(j/48));close(row['sameObservation']['time'],float(c['time']));close(row['sameSource']['time'],s['point']['retardedTime']+row['radius']/float(c['speed']))
 for f in s['angles']:check_field(c,f)
 for r in s['timeSeries']:check_field(c,r['field']);check_power(c,r['power'])
 for r in s['radiusScan']:check_field(c,r['field']);check_power(c,r['sameObservation']);check_power(c,r['sameSource']);close(r['sameSource']['retardedTime'],s['point']['retardedTime']);close(r['sameSource']['radiation'],s['power']['radiation'])
 for avg in s['averages']:
  ck(len(avg['rows'])==32);close(avg['reference'],s['meanReference']);close(avg['error'],avg['mean']-avg['reference'])
  if float(c['omega'])==0:ck(avg['period']is None)
  else:close(avg['period'],2*math.pi/float(c['omega']))
  for r in avg['rows']:
   check_field(c,r['field']);check_power(c,r['power']);ck(len(r['angularNodes'])==2)
   for node in r['angularNodes']:
    check_field(c,node['field']);close(node['u']**2,1/3);close(node['contribution'],2*math.pi*avg['radius']**2*node['field']['flux']['radial'])
   close(r['angularIntegral'],sum(n['contribution']for n in r['angularNodes']));close(r['angularIntegral'],r['power']['closed'],'two-node Gauss angular integral',2e-9)
  ref=float(c['amplitude'])**2*float(c['omega'])**4/(3*float(c['speed'])**3);close(avg['mean'],ref,'full mean',3e-9);close(avg['meanNumericalAngular'],ref,'angular numerical mean',3e-9);close(avg['mean'],math.fsum(r['power']['closed']for r in avg['rows'])/32)
 if s['pulseEnergy']:
  e=s['pulseEnergy'];D=float(c['duration']);A=float(c['amplitude']);speed=float(c['speed']);exact=Fraction(1572864,5005);close(e['polynomialIntegral'],float(exact));ck(e['exactIntegral']=={'numerator':'1572864','denominator':'5005'});close(e['closed'],2*A*A/(3*speed**3*D**3)*float(exact))
  ck(e['secondCoefficients']==SECOND and e['squareCoefficients']==SQUARED);ck(len(e['rows'])==257)
  for j,v in enumerate(e['integralTerms']):close(v,SQUARED[j]/(j+1))
  for j,row in enumerate(e['rows']):ck(row['index']==j);close(row['tau'],float(c['start'])+D*j/256);close(row['weight'],1 if j in[0,256]else 4 if j%2 else 2)
  for r in e['rows']:close(r['second'],waveform(c,r['tau'])[2],tol=2e-9);close(r['integrand'],2*r['second']**2/(3*speed**3));close(r['contribution'],D/256/3*r['weight']*r['integrand'])
  close(e['numerical'],math.fsum(r['contribution']for r in e['rows']));close(e['error'],e['numerical']-e['closed']);ck(abs(e['error'])<1e-8*(1+abs(e['closed'])))
  ck(len(e['cumulative'])==129);areas=[];square=SQUARED
  for j,row in enumerate(e['cumulative']):
   x=Fraction(j,128);fraction=sum((Fraction(int(v),n+1)*x**(n+1)for n,v in enumerate(square)),Fraction(0));ck(row['exactNormalizedIntegral']=={'numerator':str(fraction.numerator),'denominator':str(fraction.denominator)})
   ref=float(fraction)*2*A*A/(3*speed**3*D**3);close(row['reference'],ref);close(row['tau'],float(c['start'])+D*j/128)
   area=0 if j==0 else D/256/3*(e['rows'][2*j-2]['integrand']+4*e['rows'][2*j-1]['integrand']+e['rows'][2*j]['integrand']);areas.append(area);close(row['interval'],area);close(row['value'],math.fsum(areas));close(row['error'],row['value']-ref)
  close(e['cumulative'][-1]['value'],e['numerical'])

def check_sampling(s):
 c=s['parameters'];pulse=c['waveform']=='pulse';t=float(c['time']);r=float(c['radius']);speed=float(c['speed']);w=float(c['omega']);D=float(c['duration']);start=float(c['start'])
 if pulse:begin,end=start-D,start+2*D+r/speed
 else:
  half=math.pi/w if w else 2;begin,end=t-half,t+half
 times=[begin+(end-begin)*j/128 for j in range(129)]
 if pulse:
  for j in range(65):times.extend([start+D*j/64,start+D*j/64+r/speed])
 expected=sorted(set(times));actual=[row['field']['time']for row in s['timeSeries']]
 ck(len(actual)==len(expected),'time grid length')
 for x,y,row in zip(actual,expected,s['timeSeries']):close(x,y);close(row['power']['time'],y);close(row['field']['radius'],r);close(row['field']['theta'],float(c['angle'])*math.pi/180)
 ck(s['sourceCoefficients']==(COEFFICIENTS if pulse else None));ck((s['pulseEnergy']is not None)==pulse)
 if pulse:ck(s['meanReference']is None)
 else:close(s['meanReference'],float(c['amplitude'])**2*w**4/(3*speed**3))
 for j,avg in enumerate(s['averages']):
  radius=[.1,.2,.5,1,2,4,8,r][j];close(avg['radius'],radius)
  for i,row in enumerate(avg['rows']):
   ck(row['index']==i);phase=2*math.pi*i/32;at=phase/w+radius/speed if w else t
   if w:close(row['phase'],phase)
   else:ck(row['phase']is None)
   close(row['field']['time'],at);close(row['power']['time'],at);close(row['field']['radius'],radius)
   for k,node in enumerate(row['angularNodes']):close(node['u'],(-1 if k==0 else 1)/math.sqrt(3));close(node['weight'],1);close(node['field']['theta'],math.acos(node['u']));close(node['field']['time'],at);close(node['field']['radius'],radius)
  close(avg['meanNumericalAngular'],math.fsum(row['angularIntegral']for row in avg['rows'])/32)

import xml.etree.ElementTree as ET
def equal_values(a,b):
 if isinstance(a,(int,float))and not isinstance(a,bool)and isinstance(b,(int,float))and not isinstance(b,bool):close(a,b);return
 if isinstance(a,list)and isinstance(b,list):
  ck(len(a)==len(b))
  for x,y in zip(a,b):equal_values(x,y)
 else:ck(a==b,'view value '+str((a,b))[:160])
def fields(r,keys):return[r[k]for k in keys.split()]
def check_view(s,v):
 c=s['parameters'];pulse=c['waveform']=='pulse';ts=s['timeSeries'];rs=s['radiusScan'];mean=sorted(s['averages'],key=lambda r:r['radius']);e=s['pulseEnergy']
 def comp(k):return[[r['field']['time'],r['field']['components'][k]]for r in ts]
 def power(k):return[[r['power']['time'],r['power'][k]]for r in ts]
 def radii(rows):return[[[r['radius'],r[a][b]]for r in rows]for a,b in [('sameObservation','closed'),('sameSource','closed'),('sameSource','radiation')]]
 series=[
  [[[r['field']['time'],r['field']['source']['p']]for r in ts],[[r['field']['time'],waveform(c,r['field']['time'])[0]]for r in ts]],
  [comp(k)for k in ['et','etNear','etInduction','etRadiation']],
  [comp(k)for k in ['er','erNear','erInduction']],
  [comp(k)for k in ['b','bInduction','bRadiation']],
  [[[r['theta']*180/math.pi,r['flux'][k]]for r in s['angles']]for k in ['differentialPower','radiationDifferentialPower']],
  [power(k)for k in ['closed','radiation','reactive']],radii(rs),radii([r for r in rs if r['radius']>=1]),
  ([[[r['tau'],r['value']]for r in e['cumulative']],[[r['tau'],r['reference']]for r in e['cumulative']],[[r['tau'],e['closed']]for r in e['cumulative']]]if pulse else [[[r['radius'],r[k]]for r in mean]for k in ['mean','meanNumericalAngular','reference']])]
 ck([p['key']for p in v['plots']]==['delay','electric-theta','electric-radial','magnetic','angular','power','radius','radius-detail','energy'if pulse else'mean']);ck(len(v['svgs'])==9)
 for p,svg,expected in zip(v['plots'],v['svgs'],series):
  ck(len(p['series'])==len(expected))
  for row,points in zip(p['series'],expected):equal_values(row['points'],points)
  root=ET.fromstring(svg);ns='{http://www.w3.org/2000/svg}';ck(root.attrib['viewBox']=='0 0 900 460');ck(root.find(ns+'title').text==p['title']);ck(root.find(ns+'desc').text==p['caption']);lines={int(x.attrib['data-series']):x for x in root.findall(ns+'polyline')};ck(len(lines)==len(expected))
  for j,row in enumerate(p['series']):
   line=lines[j];actual=[[float(x)for x in pair.split(',')]for pair in line.attrib['points'].split()];ck(len(actual)==len(row['points']));ck(line.attrib['stroke']==row['color'])
   for xy,(x,y)in zip(actual,row['points']):
    ck(p['xMin']<=x<=p['xMax']and p['yMin']<=y<=p['yMax']);close(xy[0],104+(x-p['xMin'])/(p['xMax']-p['xMin'])*762);close(xy[1],360-(y-p['yMin'])/(p['yMax']-p['yMin'])*259)
 def frow(tag,r):return[tag]+fields(r,'time radius theta retardedTime')+fields(r['source'],'p first second third')+fields(r,'potential az')+fields(r['components'],'erNear erInduction etNear etInduction etRadiation bInduction bRadiation er et b')+fields(r['cartesian'],'x z by')+fields(r['flux'],'radial polar radiationRadial differentialPower radiationDifferentialPower')+[r['energyDensity']]
 def prow(tag,r):return[tag]+fields(r,'radius time retardedTime')+fields(r['source'],'p first second')+[r['radiation']]+fields(r['terms'],'cross induction near')+fields(r,'reactive closed reactivePrimitive')
 f=s['point'];summary=[c['waveform'],float(c['amplitude']),None if pulse else float(c['omega']),float(c['duration'])if pulse else None]+[float(c[k])for k in ['start','time','radius','angle','speed']]+[f['retardedTime'],f['source']['p'],f['flux']['radial']]+fields(s['power'],'numerical radiation reactive')+[s['meanReference'],e['closed']if e else None,s['scope']]
 expected={
  'point':[frow('当前点',f)],
  'events':[fields(r,'distance travelTime sourceStart arrival retardedTime frontArrived meaning')for r in s['events']],
  'time-fields':[frow(j,r['field'])for j,r in enumerate(ts)],
  'angle-fields':[frow(j,r)for j,r in enumerate(s['angles'])],
  'time-power':[prow(j,r['power'])for j,r in enumerate(ts)],
  'radius-power':[prow(str(j)+label,r[k])for j,r in enumerate(rs)for label,k in [(' 同观察t','sameObservation'),(' 同源τ','sameSource')]],
  'radius-fields':[frow(j,r['field'])for j,r in enumerate(rs)],
  'sphere-quadrature':[fields(r,'index u theta weight integrand contribution')for r in s['power']['rows']],
  'sphere-fields':[frow(r['index'],r['field'])for r in s['power']['rows']]}
 if not pulse:
  expected.update({
   'means':[[j]+fields(r,'radius period mean meanNumericalAngular reference error scope')for j,r in enumerate(s['averages'])],
   'mean-phases':[prow(str(j)+' / '+str(t['index']),t['power'])+fields(t,'phase angularIntegral')for j,r in enumerate(s['averages'])for t in r['rows']],
   'mean-fields':[frow(str(j)+' / '+str(t['index']),t['field'])for j,r in enumerate(s['averages'])for t in r['rows']],
   'mean-angle-nodes':[frow(str(j)+' / '+str(t['index'])+' / '+str(k),n['field'])+fields(n,'u weight contribution')for j,r in enumerate(s['averages'])for t in r['rows']for k,n in enumerate(t['angularNodes'])]})
 else:
  expected.update({
   'pulse-integral':[fields(r,'index tau second weight integrand contribution')for r in e['rows']],
   'pulse-cumulative':[fields(r,'index tau interval value reference error')+fields(r['exactNormalizedIntegral'],'numerator denominator')for r in e['cumulative']],
   'pulse-coefficients':[[j,e['secondCoefficients'][j]if j<len(e['secondCoefficients'])else 0,x,e['integralTerms'][j]]for j,x in enumerate(e['squareCoefficients'])]})
 ck([t['key']for t in v['tables']]==['summary']+list(expected));ck(len(v['formatted'])==len(expected)+1)
 for table,formatted in zip(v['tables'],v['formatted']):
  if table['key']=='summary':equal_values([r[1]for r in table['rows']],summary);ck(all(len(r)==2 and r[0]for r in table['rows']))
  else:equal_values(table['rows'],expected[table['key']])
  ck(len(formatted)==len(table['rows']));ck(all(len(r)==len(table['headers'])for r in table['rows']))
  for row,raw in zip(formatted,table['rows']):
   ck(len(row)==len(raw))
   for text,value in zip(row,raw):
    ck(isinstance(text,str))
    if isinstance(value,bool):ck(text==str(value).lower())
    elif isinstance(value,(int,float)):close(float(text),value,'formatted number',6e-8)
    elif value is None:ck(text=='不适用')
    else:ck(text==value)

for d,v in zip(bundle["states"],bundle["views"]):check_state(d);check_view(d,v)

import re,html,hashlib
from html.parser import HTMLParser
f=json.loads(FIXTURE.read_text());ck(f['schema']==1);ck(f['provenance']=={'date':'2026-09-12','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()});ck(bundle['frozen']==4)
if not STAGING:
 src=(ROOT/'physics-course/lectures/ced-02-radiation.md').read_text();site=(ROOT/'physics-course/site/ced-02-radiation.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'source formulas reach HTML in order');ck(len(re.findall(r'^## [0-9]+\.',src,re.M))==12);ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site))
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack);kind=dict(attrs).get('class');ck(kind in ['answer','page-toc']);self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack));self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack));ck(self.stack.pop()[1]==1)
 parser=Disclosure();parser.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(parser.answers==4 and not parser.stack)
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'physics-course/site'/target).exists(),'local target '+target)
 for course in ['ai-course','grad-math','math-course','physics-course']:ck((ROOT/course/'site/assets/learning/labs/retarded-radiation.js').read_bytes()==JS.read_bytes())
 ck((ROOT/'physics-course/site/assets/learning/projects/retarded-radiation/run-snapshot.json').read_bytes()==FIXTURE.read_bytes());ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_retarded_radiation_full.py')==1)
 image=ROOT/'physics-course/images/ced-02-radiation-ledgers.svg';ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/ced-02-radiation-ledgers.svg').read_bytes());root=ET.parse(image).getroot();ck(root.attrib['viewBox']=='0 0 1000 2300');panels=root.findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4)
 def compare(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib));ck(a.text==b.text and a.tail==b.tail)
  for k,v in a.attrib.items():
   if k in ['x','y','x1','y1','x2','y2','cx','cy','r','width','height']:close(float(v),float(b.attrib[k]))
   else:ck(v==b.attrib[k])
  ck(len(a)==len(b))
  for x,y in zip(a,b):compare(x,y)
 # Frozen bundle order: return, pulse, front, static.
 for i,(p,j,k)in enumerate(zip(panels,[-4,-3,-2,-1],[5,8,0,1])):
  ck(p.attrib.pop('x')=='50'and p.attrib.pop('y')==str([85,640,1195,1750][i]));compare(p,ET.fromstring(bundle['views'][j]['svgs'][k]))
 table=re.search(r'data-learning-lab="retarded-radiation".*?<tbody>(.*?)</tbody>',site,re.S).group(1);vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 r=f['return'];p=f['pulse'];n=f['front'];s0=f['static']
 refs=[r['point']['retardedTime'],r['point']['components']['et'],r['point']['components']['b'],r['power']['numerical'],r['power']['radiation'],r['meanReference'],p['point']['retardedTime'],p['point']['source']['p'],p['point']['source']['second'],p['pulseEnergy']['closed'],p['pulseEnergy']['numerical'],p['pulseEnergy']['error'],n['events'][2]['arrival'],n['point']['retardedTime'],n['point']['components']['et'],n['power']['numerical'],s0['point']['components']['er'],s0['point']['components']['et'],s0['point']['components']['b'],s0['power']['numerical']];ck(len(vals)==len(refs)==20)
 for v,r in zip(vals,refs):close(float(v),r)
 for word in ['Lorenz','连续方程','分布源','两个小参数','叉乘顺序','反应性','Simpson','Gauss','1572864','累计净能量','同源时刻','绝热开启']:ck(word in src,'proof and interpretation '+word)
 with tempfile.TemporaryDirectory()as td:
  out=Path(td)/'figure.svg';fallback=Path(td)/'fallback.md';subprocess.run(PREFIX+['python3',str(ROOT/'tools/build_retarded_radiation_figure.py'),str(JS),str(out),str(FIXTURE),str(fallback)],check=True,stdout=subprocess.DEVNULL);compare(ET.parse(image).getroot(),ET.parse(out).getroot());ck(fallback.read_text()in src)
 print('formulas='+str(len(formulas)))
print(json.dumps({'status':'PASS','live':bundle['live'],'frozen':bundle['frozen'],'checks':checks,'invalid':bundle['invalid'],'mutationGuards':bundle['mutationGuards'],'self':bundle['self']['checks'],'invariance':bundle['invariance']}))
