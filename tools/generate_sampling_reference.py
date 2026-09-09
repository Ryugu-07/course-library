from pathlib import Path
import json, math, re
import numpy as np
from scipy.stats import gamma, norm, chi2, t, f
import sympy as s
root=Path(__file__).resolve().parents[1]
rows=[]
for n in [5,6,10,20,55,100]:
 for model in ['normal','skewed','clustered']:
  for estimator in ['mean','variance']:
   if model=='skewed'and estimator=='variance':continue
   dist=norm(10,2/math.sqrt(n))if model=='normal'and estimator=='mean'else norm(0,math.sqrt(1+1/n))if model=='clustered'and estimator=='mean'else gamma(a=n,scale=1/n)if estimator=='mean'else gamma(a=(n-1)/2,scale=2*(4 if model=='normal'else 1)/(n-1))
   xs=dist.ppf(np.linspace(.0001,.9999,41));rows.append({'n':n,'model':model,'estimator':estimator,'x':xs.tolist(),'pdf':dist.pdf(xs).tolist()})
svg=(root/'math-course/images/stat-01-sampling-dists.svg').read_text();fig=[]
for tag in re.findall(r'<path\b[^>]*/>',svg):
 ident=re.search(r'data-curve="([^"]+)"',tag).group(1)
 pts=[list(map(float,p))for p in re.findall(r'[ML]([-\d.e]+),([-\d.e]+)',re.search(r'd="([^"]+)"',tag).group(1))]
 if ident.startswith('chi-'):j=0;a=0;b=20;ymax=.55;dist=chi2(int(ident.split('-')[1]))
 elif ident.startswith('F-'):j=2;a=0;b=5;ymax=1.2;m,n=map(int,ident.split('-')[1:]);dist=f(m,n)
 else:j=1;a=-5;b=5;ymax=.42;dist=norm()if ident=='normal'else t(int(ident.split('-')[1]))
 # Use the exact analytic sampling abscissae, rather than rounded SVG x values.
 xs=np.linspace(a,b,601);expected=dist.pdf(xs)
 fig.append({'id':ident,'panel':j,'a':a,'b':b,'ymax':ymax,'pdf':expected.tolist()})
n=s.symbols('n',positive=True);assert s.simplify((9-(n-3)/(n-1))/n-(8/n+2/(n*(n-1))))==0
# Independent normal projection via a Householder basis.
maxerror=0
for N in [5,10,20,100]:
 u=np.ones(N)/math.sqrt(N);e=np.zeros(N);e[0]=1;v=e-u;Q=np.eye(N)-2*np.outer(v,v)/(v@v)
 maxerror=max(maxerror,np.max(abs(Q@Q.T-np.eye(N))))
 z=np.random.default_rng(N).normal(size=(100,N));w=z@Q.T
 assert np.allclose(w[:,0],z.sum(axis=1)/math.sqrt(N))
 assert np.allclose(np.sum(w[:,1:]**2,axis=1),np.sum((z-z.mean(axis=1)[:,None])**2,axis=1))
target=root/'tools/fixtures/sampling-reference.json';target.write_text(json.dumps({'source':'SciPy exact sampling densities and figure PDFs; NumPy independent Householder projections','rows':rows,'figures':fig,'chiTail':float(chi2.sf(18.09,9))},indent=2));print('PASS: 30 density grids, 10 SVG references, 400 orthogonal projection cases; max error',maxerror)
