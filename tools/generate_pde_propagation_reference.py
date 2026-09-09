"""Independent mpmath tanh-sinh convolution, scaled only to retain remote tails."""
from pathlib import Path
import json,math
import mpmath as m
m.mp.dps=90
out={'method':'90-digit tanh-sinh integration on tent halves with Gaussian exponent factored out; independent erf primitive where cancellation permits','heat':[],'erfChecks':0}
for x in [-25,-15,-10,-7,-1,-.3,0,1,3,5,10,15,25]:
 for t in [.1,.5,3,8]:
  for k in [.1,1,3]:
   X,T,K=map(m.mpf,[x,t,k]);q=K*T;d=max(m.mpf(0),abs(X)-1)
   integrand=lambda y:(1-abs(y))*m.exp(-(X-y)**2/(4*q)+d*d/(4*q))
   a=m.quad(integrand,[-1,0,1]);logu=m.log(a)-m.log(4*m.pi*q)/2-d*d/(4*q);u=m.exp(logu)
   if d*d/(4*q)<80:
    H=lambda z:z*m.erf(z/(2*m.sqrt(q)))/2+m.sqrt(q/m.pi)*m.exp(-z*z/(4*q))
    exact=H(X+1)-2*H(X)+H(X-1)
    assert abs(exact/u-1)<m.mpf('1e-45');out['erfChecks']+=1
   out['heat'].append({'x':x,'time':t,'diffusivity':k,'value':float(u),'logValue':float(logu)})
p=Path(__file__).parent/'fixtures/pde-propagation-reference.json';p.write_text(json.dumps(out,indent=2)+'\n');print('PASS',len(out['heat']),'heat references',out['erfChecks'],'erf cross checks')
