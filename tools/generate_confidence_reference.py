"""SciPy quantiles and adaptive quadrature independent of browser numerics."""
from pathlib import Path
import json, math, random
from scipy.stats import norm,t,chi2
from scipy.integrate import quad
rows=[];critical=[]
for c in [.9,.95,.99]:
 z=norm.ppf((1+c)/2)
 for df in list(range(1,60))+[100,500,1000]:critical.append(dict(c=c,df=df,z=float(z),t=float(t.ppf((1+c)/2,df))))
 for n in range(2,61):
  df=n-1;tc=t.ppf((1+c)/2,df)
  # Integrate over the chi variate, not the normal variate used by the lab.
  cut=z/tc
  f=lambda v: (2*norm.cdf(tc*v)-1)*2*df*v*chi2.pdf(df*v*v,df) if v>0 else (0 if df>1 else 0)
  part,error=quad(f,0,cut,epsabs=2e-13,epsrel=2e-13,limit=200)
  selected=float(part+c*chi2.sf(df*cut*cut,df));selectT=float(chi2.cdf(df*cut*cut,df))
  rows.append(dict(c=c,n=n,coverage=selected,selectT=selectT,error=error))
rng=random.Random(734021);samples=[[500+8*rng.gauss(0,1)for _ in range(16)]for _ in range(24)]
cases=[]
for values in samples:
 center=sum(values)/16;sd=math.sqrt(sum((v-center)**2 for v in values)/15);mz=float(norm.ppf(.975))*2;mt=float(t.ppf(.975,15))*sd/4
 cases.append(dict(values=values,center=center,sd=sd,z=mz,t=mt,selected=min(mz,mt)))
examples=dict(mean=[503-t.ppf(.975,15)*1.5,503+t.ppf(.975,15)*1.5],variance=[540/chi2.ppf(.975,15),540/chi2.ppf(.025,15)],wilson=norm.ppf(.975)**2/(10+norm.ppf(.975)**2),cp=1-.025**.1)
examples['sd']=[math.sqrt(v)for v in examples['variance']]
path=Path(__file__).resolve().parents[1]/'tools/fixtures/confidence-reference.json';path.write_text(json.dumps(dict(critical=critical,selection=rows,samples=cases,examples=examples),indent=2)+'\n');print('PASS',len(critical),'quantiles,',len(rows),'independent quadratures');print(examples)
