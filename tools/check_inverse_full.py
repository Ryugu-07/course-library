"""Independent high-precision Gaussian posterior and full deterministic draw audit."""
from pathlib import Path
import subprocess,shutil,json,math,sys,re,html,xml.etree.ElementTree as ET
from decimal import Decimal,localcontext
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-inverse-uncertainty.js'
script=r'''
const a=require(process.argv[1]),configs=[...a.PRESETS];
for(const transmission of [0,1e-6,1])for(const lambda of [1e-5,100])configs.push({mode:"contrast",transmission,lambda,sigmaFit:.01,seed:0,priorContrast:1});
for(const order of [0,1,2])for(const widthFit of [.06,.25])for(const sigmaFit of [.01,.2])configs.push({order,widthFit,sigmaFit,lambda:1e-5,draws:16,seed:4294967295});
configs.push({mode:"risk",sigmaData:.001,sigmaFit:.2,widthTrue:.25,order:2,draws:128,priorMean:1});
let invalid=0;
for(const mode of ["contrast","inverse","risk"]){
 const fields=["sigmaData","sigmaFit","lambda","priorMean","seed",...(mode==="contrast"?["transmission","contrast","priorContrast"]:["widthTrue","widthFit","order","draws"])];
 for(const field of fields)for(const value of ["",null,true,false,[],{},NaN,Infinity,-Infinity,"NaN","1e309","1e-400"]){
  let caught=false;try{a.config({mode,[field]:value});}catch(e){caught=true;}if(!caught)throw Error("invalid "+mode+field+String(value));invalid++;
 }
}
for(const c of [{mode:"x"},{lambda:0},{lambda:101},{lambda:1e-6},{sigmaFit:0},{sigmaData:-1},{sigmaData:1e-5},{sigmaData:.21},{seed:-1},{seed:4294967296},{seed:1.5},{priorMean:1.01},{widthTrue:.05},{widthFit:.3},{order:1.5},{order:3},{draws:15},{draws:129},{draws:1.5},{mode:"contrast",transmission:1e-7},{mode:"contrast",transmission:1.1},{mode:"contrast",contrast:2.1},{mode:"contrast",priorContrast:-2.1},null,[]]){
 let caught=false;try{a.config(c);}catch(e){caught=true;}if(!caught)throw Error("invalid boundary");invalid++;
}
a.snapshot({mode:"contrast",widthTrue:"",widthFit:null,draws:0,order:4});
a.snapshot({mode:"inverse",transmission:"",contrast:null,priorContrast:[]});
console.log(JSON.stringify({states:configs.map(c=>{const d=a.snapshot(c),plots=a.plots(d);return{...d,plots,ledgers:a.ledgers(d),svgs:plots.map(a.svg)};}),invalid,self:a.selfTest()}));
'''
data=json.loads(subprocess.check_output(PREFIX+['node','-e',script,str(JS.resolve())],text=True))
checks=0;worst={}
def ck(v,label):
 global checks
 assert v,label;checks+=1
def close(x,y,label,rtol=3e-7,atol=2e-9):
 y=float(y);ck(isinstance(x,(int,float))and math.isfinite(x)and abs(x-y)<=atol+rtol*abs(y),(label,x,y))
def vector(x,y,label,rtol=3e-7,atol=2e-9):
 ck(len(x)==len(y),label+' length')
 for a,b in zip(x,y):close(a,b,label,rtol,atol)
def matrix(x,y,label,rtol=3e-7,atol=2e-9):
 ck(len(x)==len(y),label+' rows')
 for a,b in zip(x,y):vector(a,b,label,rtol,atol)
def D(x):return Decimal(int(x))if isinstance(x,bool)else Decimal(str(x))
def transpose(A):return list(map(list,zip(*A)))
def mv(A,x):return[sum(a*b for a,b in zip(row,x))for row in A]
def mm(A,B):return[[sum(a*b for a,b in zip(row,col))for col in zip(*B)]for row in A]
def inv(A):
 n=len(A);a=[row[:]+[Decimal(i==j)for j in range(n)]for i,row in enumerate(A)]
 for k in range(n):
  pivot=max(range(k,n),key=lambda i:abs(a[i][k]));a[k],a[pivot]=a[pivot],a[k]
  z=a[k][k];assert z;a[k]=[v/z for v in a[k]]
  for i in range(n):
   if i!=k:
    z=a[i][k];a[i]=[v-z*w for v,w in zip(a[i],a[k])]
 return[row[n:]for row in a]
cacheK={};cacheP={}
def kernel(width,positions):
 key=width,tuple(positions)
 if key not in cacheK:
  w=D(width);A=[]
  for x in positions:
   raw=[(-(D(x)-Decimal(j)/15)**2/(2*w*w)).exp()for j in range(16)];z=sum(raw);A.append([v/z for v in raw])
  cacheK[key]=A
 return cacheK[key]
def penalty(n,order):
 DD=[[Decimal(i==j)for j in range(n)]for i in range(n)]if order==0 else[[D((-1 if j==i else 1 if j==i+1 else 0)if order==1 else(1 if j in [i,i+2]else-2 if j==i+1 else 0))for j in range(n)]for i in range(n-order)]
 R=mm(transpose(DD),DD)
 for i in range(n):R[i][i]+=D('.001')
 return DD,R
def posterior(K,R,y,m0,sigma,lam):
 key=tuple(map(tuple,K)),tuple(map(tuple,R)),sigma,lam
 sf=D(sigma);ll=D(lam);n=len(R);kt=transpose(K)
 if key not in cacheP:
  P=mm(kt,K);P=[[v/(sf*sf)+ll*R[i][j]for j,v in enumerate(row)]for i,row in enumerate(P)];cov=inv(P);G=[[v/(sf*sf)for v in row]for row in mm(cov,kt)]
  cacheP[key]=P,cov,G
 P,cov,G=cacheP[key];prior=mv(K,m0);shift=mv(G,[v-w for v,w in zip(y,prior)]);mu=[v+w for v,w in zip(m0,shift)];res=[v-w for v,w in zip(y,mv(K,mu))]
 pen=sum(a*b for a,b in zip(shift,mv(R,shift)))
 return dict(P=P,cov=cov,G=G,mu=mu,shift=shift,res=res,pen=pen,resNorm=sum(v*v for v in res).sqrt())
def risk(ref,Ktrue,truth,m0,sd,K):
 ex=[a+b for a,b in zip(m0,mv(ref['G'],[a-b for a,b in zip(mv(Ktrue,truth),mv(K,m0))]))];bias=[a-b for a,b in zip(ex,truth)]
 cov=[[D(sd)**2*v for v in row]for row in mm(ref['G'],transpose(ref['G']))];n=len(truth)
 return dict(mean=ex,bias=bias,cov=cov,biasSquared=sum(v*v for v in bias)/n,variance=sum(cov[i][i]for i in range(n))/n,mse=(sum(v*v for v in bias)+sum(cov[i][i]for i in range(n)))/n,posteriorVariance=sum(ref['cov'][i][i]for i in range(n))/n)
def verify_state(d):
 s=d['config'];v=d['result'];post=v['post'];mode=s['mode'];n=2 if mode=='contrast'else 16
 if mode=='contrast':
  k=D(s['transmission']);K=[[(1+k)/2,(1-k)/2],[(1-k)/2,(1+k)/2]];Kt=K;R=[[D(i==j)for j in range(2)]for i in range(2)]
  truth=[D(1)+D(s['contrast']),D(1)-D(s['contrast'])];m0=[D(s['priorMean'])+D(s['priorContrast']),D(s['priorMean'])-D(s['priorContrast'])]
 else:
  positions=[i/15 for i in range(16)];K=kernel(s['widthFit'],positions);Kt=kernel(s['widthTrue'],positions);DD,R=penalty(16,s['order']);matrix(v['D'],DD,'D');matrix(v['R'],R,'R')
  truth=[D(.15+.95*math.exp(-.5*((i/15-.28)/.075)**2)+.7*math.exp(-.5*((i/15-.73)/.11)**2))for i in range(16)];m0=[D(s['priorMean'])]*16
 matrix(v['K'],K,'kernel');vector(v['truth'],truth,'truth');vector(v['m0'],m0,'prior mean')
 seed=s['seed'];normal=[]
 for i,row in enumerate(v['noise']):
  seed=(1664525*seed+1013904223)%2**32;state1=seed;u=(seed+.5)/2**32
  seed=(1664525*seed+1013904223)%2**32;vv=(seed+.5)/2**32;z=math.sqrt(-2*math.log(u))*math.cos(2*math.pi*vv);normal.append(z)
  ck(row['i']==i+1 and row['state1']==state1 and row['state2']==seed and row['u']==u and row['v']==vv,'integer LCG');close(row['z'],z,'Box Muller',rtol=1e-13,atol=1e-13)
  if i<n:stage='data'if mode=='contrast'else'training';index=i
  elif i<n+15:stage='heldout';index=i-n
  else:
   j=i-n-15;b=j//32;index=j%16;stage=('posterior-'if j%32<16 else'replica-')+str(b)
  ck(row['stage']==stage and row['index']==index,'draw purpose')
 ck(v['lastState']==seed and v['calls']==2*len(normal),'draw accounting')
 ck(len(normal)==(2 if mode=='contrast'else 16+15+32*s['draws']),'actual draw budget')
 y=[a+D(s['sigmaData'])*D(z)for a,z in zip(mv(Kt,truth),normal)];vector(v['data'],y,'training data');vector(v['clean'],mv(Kt,truth),'noiseless training')
 ref=posterior(K,R,y,m0,s['sigmaFit'],s['lambda'])
 matrix(post['precision'],ref['P'],'precision');matrix(post['covariance'],ref['cov'],'posterior covariance');matrix(post['gain'],ref['G'],'gain',atol=3e-8);vector(post['mean'],ref['mu'],'posterior mean',atol=3e-8)
 vector(post['shift'],ref['shift'],'posterior shift',atol=3e-8);vector(post['residuals'],ref['res'],'data residual',atol=1e-9);close(post['penalty'],ref['pen'],'full penalty');close(post['residualNorm'],ref['resNorm'],'residual norm')
 r=risk(ref,Kt,truth,m0,s['sigmaData'],K)
 for key in ['biasSquared','variance','mse','posteriorVariance']:close(v['risk'][key],r[key],'risk '+key)
 vector(v['risk']['mean'],r['mean'],'risk mean',atol=3e-8);vector(v['risk']['bias'],r['bias'],'bias',atol=3e-8);matrix(v['risk']['covariance'],r['cov'],'sampling covariance')
 for i,row in enumerate(v['risk']['rows']):
  vals=dict(i=i,truth=truth[i],expected=r['mean'][i],bias=r['bias'][i],biasSquared=r['bias'][i]**2,samplingVariance=r['cov'][i][i],mse=r['bias'][i]**2+r['cov'][i][i],posteriorVariance=ref['cov'][i][i])
  for key,val in vals.items():close(row[key],val,'risk row '+key,atol=3e-8)
 # QR is checked by its defining identities, independently of the reflector algorithm.
 L=[[D(x)for x in row]for row in post['L']];U=transpose(L);qt=[[D(x)for x in row]for row in post['qr']['Qt']]
 identity=[[D(i==j)for j in range(n)]for i in range(n)]
 matrix([[float(x)for x in row]for row in mm(qt,transpose(qt))],identity,'Qt orthonormal',rtol=1e-11,atol=2e-12)
 matrix([[float(x)for x in row]for row in mm(L,U)],ref['P'],'QR precision',rtol=1e-11,atol=2e-10)
 matrix(post['qr']['upper'],U,'upper is transpose factor',rtol=0,atol=0)
 A=[[D(x)for x in row]for row in post['augmented']]
 matrix([[float(x)for x in row]for row in mm(qt,A)],U,'Qt A upper',rtol=1e-10,atol=2e-10)
 C=[[D(x)for x in row]for row in post['priorRoot']]
 matrix([[float(x)for x in row]for row in mm(C,transpose(C))],R,'prior factor identity',rtol=1e-12,atol=1e-12)
 matrix(post['augmented'],[[x/D(s['sigmaFit'])for x in row]for row in K]+[[D(s['lambda']).sqrt()*x for x in row]for row in transpose(C)],'actual augmented model',rtol=1e-12,atol=1e-12)
 augmentedRhs=[(a-b)/D(s['sigmaFit'])for a,b in zip(y,mv(K,m0))]+[D(0)]*n
 vector(post['augmentedRhs'],augmentedRhs,'actual augmented right side',rtol=1e-12,atol=1e-12)
 vector(post['projected'],mv(qt,augmentedRhs),'projected right side',rtol=1e-10,atol=1e-11)
 vector(post['rhs'],mv(transpose(K),[(a-b)/D(s['sigmaFit'])**2 for a,b in zip(y,mv(K,m0))]),'normal right side',rtol=1e-12,atol=1e-10)
 il=[[D(x)for x in row]for row in post['inverseL']]
 matrix([[float(x)for x in row]for row in mm(L,il)],identity,'inverse factor',rtol=1e-11,atol=1e-10)
 close(post['objective'],ref['resNorm']**2/D(s['sigmaFit'])**2+D(s['lambda'])*ref['pen'],'objective')
 ck(len(post['qr']['steps'])==n,'all QR reflectors')
 for i,step in enumerate(post['qr']['steps']):
  ck(step['k']==i and len(step['vector'])==2*n-i,'full reflector')
  close(sum(x*x for x in step['vector']),1,'unit reflector',rtol=1e-12,atol=1e-12)
  close(abs(step['alpha']),step['norm'],'reflection target norm',rtol=0,atol=0)
 if mode=='contrast':
  for i,row in enumerate(v['modes']):
   a=D(1)if i==0 else D(s['transmission']);z=(y[0]+(-1 if i else 1)*y[1])/D(2).sqrt();prior=(m0[0]+(-1 if i else 1)*m0[1])/D(2).sqrt()
   den=a*a+D(s['lambda'])*D(s['sigmaFit'])**2
   ck(row['i']==i,'mode index')
   close(row['truth'],(truth[0]+(-1 if i else 1)*truth[1])/D(2).sqrt(),'true mode')
   close(row['mean'],(ref['mu'][0]+(-1 if i else 1)*ref['mu'][1])/D(2).sqrt(),'QR mode coefficient',atol=5e-8)
   for key,val in [('transmission',a),('data',z),('prior',prior),('analyticMean',(a*z+D(s['lambda'])*D(s['sigmaFit'])**2*prior)/den),('variance',D(s['sigmaFit'])**2/den),('gain',a/den),('resolution',a*a/den)]:close(row[key],val,'singular direction '+key)
   if a==0:ck(row['leastSquares']is None,'no inverse on nullspace')
   else:close(row['leastSquares'],z/a,'LS noise amplification')
  ck(len(v['family'])==65,'all comparison sources')
  for i,row in enumerate(v['family']):
   ck(row['i']==i,'family index')
   c=D(-2)+D(i)/16;expect=mv(K,[1+c,1-c])
   vector([row['contrast'],row['x0'],row['x1'],row['y0'],row['y1']],[c,1+c,1-c,*expect],'null family')
  for row in v['study']:
   k=D(row['k']);den=k*k+D(s['lambda'])*D(s['sigmaFit'])**2
   vector([row['leastSquaresGain'],row['regularizedGain'],row['resolution']],[1/k,k/den,k*k/den],'transmission study')
  grid=[10**(-6+i/8)for i in range(49)]
  if s['transmission']>0 and not any(abs(x-s['transmission'])<1e-14 for x in grid):grid.append(s['transmission'])
  vector([x['k']for x in v['study']],sorted(grid),'complete transmission grid',rtol=1e-12,atol=1e-15)
  return
 heldPos=[(i+.5)/15 for i in range(15)];Kh=kernel(s['widthFit'],heldPos);Kht=kernel(s['widthTrue'],heldPos);heldY=[a+D(s['sigmaData'])*D(z)for a,z in zip(mv(Kht,truth),normal[16:31])]
 matrix(v['held'],Kh,'held assumed');matrix(v['heldTrue'],Kht,'held true');vector(v['heldData'],heldY,'held data');matrix(v['Ktrue'],Kt,'true kernel')
 vector(v['heldClean'],mv(Kht,truth),'held noiseless data')
 vector(v['positions'],positions,'source positions');vector(v['heldPositions'],heldPos,'held positions')
 ck(len(v['source'])==16,'all source coordinates')
 for i,row in enumerate(v['source']):
  var=ref['cov'][i][i];mu=ref['mu'][i]
  for key,val in [('i',i),('position',positions[i]),('truth',truth[i]),('mean',mu),('variance',var),('low',mu-D('1.96')*var.sqrt()),('high',mu+D('1.96')*var.sqrt())]:close(row[key],val,'source posterior '+key,atol=3e-8)
 close(v['sourceMSE'],sum((a-b)**2 for a,b in zip(ref['mu'],truth))/16,'realized source MSE')
 for A,records in [(K,v['prediction']),(Kh,v['heldPrediction'])]:
  means=mv(A,ref['mu']);cov=mm(mm(A,ref['cov']),transpose(A))
  ck(len(records)==len(A),'all predictive points')
  for i,row in enumerate(records):
   var=cov[i][i];total=var+D(s['sigmaFit'])**2
   for key,val in [('mean',means[i]),('latentVariance',var),('variance',total),('latentLow',means[i]-D('1.96')*var.sqrt()),('latentHigh',means[i]+D('1.96')*var.sqrt()),('low',means[i]-D('1.96')*total.sqrt()),('high',means[i]+D('1.96')*total.sqrt())]:close(row[key],val,'prediction '+key,atol=2e-8)
 def upper_solve(z):
  x=[Decimal(0)]*n
  for i in range(n-1,-1,-1):x[i]=(D(z[i])-sum(U[i][j]*x[j]for j in range(i+1,n)))/U[i][i]
  return x
 hits=0;obsValues=[];repValues=[]
 for b,row in enumerate(v['ppc']['rows']):
  z=normal[31+32*b:31+32*b+16];eps=normal[31+32*b+16:31+32*(b+1)];shift=upper_solve(z);x=[D(a)+bb for a,bb in zip(post['mean'],shift)]
  pred=mv([[D(a)for a in row]for row in v['K']],x);replica=[a+D(s['sigmaFit'])*D(bb)for a,bb in zip(pred,eps)]
  obs=sum((D(a)-b)**2 for a,b in zip(v['data'],pred))/(16*D(s['sigmaFit'])**2);rep=sum(D(z)**2 for z in eps)/16
  hit=rep>=obs;ck(row['b']==b and row['hit']==hit,'paired event');close(row['observed'],obs,'paired observed');close(row['replicated'],rep,'paired replicated');hits+=hit;obsValues.append(obs);repValues.append(rep)
  for i,sample in enumerate(v['ppc']['samples'][b*16:(b+1)*16]):
   ck(sample['b']==b and sample['i']==i,'sample ownership')
   for key,val in [('z',z[i]),('shift',shift[i]),('x',x[i]),('prediction',pred[i]),('observed',v['data'][i]),('replica',replica[i]),('replicaNoise',eps[i])]:close(sample[key],val,'full posterior sample '+key,atol=2e-8)
 ck(len(v['ppc']['rows'])==s['draws']and len(v['ppc']['samples'])==16*s['draws'],'all posterior samples')
 ck(v['ppc']['hits']==hits and v['ppc']['pValue']==hits/s['draws'],'PPC event probability')
 close(v['ppc']['observedMean'],sum(obsValues)/s['draws'],'mean observed discrepancy');close(v['ppc']['replicatedMean'],sum(repValues)/s['draws'],'mean replica discrepancy')
 pc=mm(mm(K,ref['cov']),transpose(K));expected=(ref['resNorm']**2+sum(pc[i][i]for i in range(n)))/(n*D(s['sigmaFit'])**2)
 close(v['ppc']['expectedObserved'],expected,'analytic observed discrepancy');ck(v['ppc']['expectedReplicated']==1,'analytic replica discrepancy')
 ck(v['trainingCoverage']==sum(row['low']<=v['data'][i]<=row['high']for i,row in enumerate(v['prediction'])),'training in-band')
 ck(v['heldCoverage']==sum(row['low']<=v['heldData'][i]<=row['high']for i,row in enumerate(v['heldPrediction'])),'heldout in-band')
 for row in v['study']:
  rr=posterior(K,R,y,m0,s['sigmaFit'],row['lambda']);rk=risk(rr,Kt,truth,m0,s['sigmaData'],K)
  diff=mv(DD,rr['shift']);actual=sum((a-b)**2 for a,b in zip(rr['mu'],truth))/16
  for key,val in [('residualNorm',rr['resNorm']),('differenceNorm',sum(a*a for a in diff).sqrt()),('penaltyNorm',rr['pen'].sqrt()),('biasSquared',rk['biasSquared']),('variance',rk['variance']),('mse',rk['mse']),('posteriorVariance',rk['posteriorVariance']),('actualMSE',actual)]:close(row[key],val,'full lambda study '+key)
 grid=[10**(-5+i/4)for i in range(29)]
 if not any(abs(x-s['lambda'])<1e-14 for x in grid):grid.append(s['lambda'])
 vector([x['lambda']for x in v['study']],sorted(grid),'complete lambda grid',rtol=1e-12,atol=1e-14)

def verify_views(d):
 s=d['config'];v=d['result'];p=v['post'];mode=s['mode']
 # These mappings state the physical meaning of each plotted coordinate.
 if mode=='contrast':
  expected=[
   {'truth':list(enumerate(v['truth'])),'prior':list(enumerate(v['m0'])),'mean':list(enumerate(p['mean'])),
    'low':[(i,x-1.96*math.sqrt(p['covariance'][i][i]))for i,x in enumerate(p['mean'])],
    'high':[(i,x+1.96*math.sqrt(p['covariance'][i][i]))for i,x in enumerate(p['mean'])]},
   {'first':[(x['contrast'],x['y0'])for x in v['family']],'second':[(x['contrast'],x['y1'])for x in v['family']]},
   {'ls':[(math.log10(x['k']),math.log10(x['leastSquaresGain']))for x in v['study']],
    'regularized':[(math.log10(x['k']),math.log10(x['regularizedGain']))for x in v['study']]},
   {'prior-variance':[(i,math.log10(1/s['lambda']))for i in range(2)],
    'posterior-variance':[(x['i'],math.log10(x['variance']))for x in v['modes']]}]
 else:
  source={key:[(x['position'],x[field])for x in v['source']]for key,field in [('truth','truth'),('mean','mean'),('low','low'),('high','high')]}
  if mode=='risk':
   expected=[source,
    {key:[(v['positions'][x['i']],x[field])for x in v['risk']['rows']]for key,field in [('bias','biasSquared'),('variance','samplingVariance'),('mse','mse'),('posterior','posteriorVariance')]},
    {key:[(math.log10(x['lambda']),x[field])for x in v['study']]for key,field in [('bias','biasSquared'),('variance','variance'),('mse','mse'),('posterior','posteriorVariance')]},
    {key:[(math.log10(x['lambda']),x[field])for x in v['study']]for key,field in [('realized','actualMSE'),('risk','mse')]}]
  else:
   train={'data':list(zip(v['positions'],v['data']))}
   train.update({key:[(v['positions'][x['i']],x[field])for x in v['prediction']]for key,field in [('fit','mean'),('latent-low','latentLow'),('latent-high','latentHigh'),('predictive-low','low'),('predictive-high','high')]})
   held={'held-data':list(zip(v['heldPositions'],v['heldData']))}
   held.update({key:[(v['heldPositions'][x['i']],x[field])for x in v['heldPrediction']]for key,field in [('held-mean','mean'),('held-low','low'),('held-high','high')]})
   top=max(max(x['observed'],x['replicated'])for x in v['ppc']['rows'])*1.08
   expected=[source,train,held,{'identity':[(0,0),(top,top)],'ppc':[(x['observed'],x['replicated'])for x in v['ppc']['rows']]},
    {'lcurve':[(math.log10(x['penaltyNorm']),math.log10(x['residualNorm']))for x in v['study']]}]
 ck(len(d['plots'])==len(d['svgs'])==len(expected),'all graph panels')
 for pi,(q,source,wanted)in enumerate(zip(d['plots'],d['svgs'],expected)):
  root=ET.fromstring(source);ns={'s':'http://www.w3.org/2000/svg'}
  ck(root.find('s:title',ns).text==q['title'],'accessible title')
  xf=lambda x:100+750*(x-q['xmin'])/(q['xmax']-q['xmin'])
  yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  ck([r['key']for r in q['series']]==list(wanted),'semantic series set')
  for line in q['series']:
   points=wanted[line['key']];ck(len(line['points'])==len(points),'complete semantic graph')
   nodes=root.findall('.//s:circle[@data-series="'+line['key']+'"]',ns);ck(len(nodes)==len(points),'all markers')
   poly=root.find('.//s:polyline[@data-series="'+line['key']+'"]',ns);ck((poly is not None)==line['line'],'line policy')
   coords=[list(map(float,x.split(',')))for x in poly.get('points').split()]if poly is not None else None
   if coords is not None:ck(len(coords)==len(points),'polyline completeness')
   for i,((x,y),(ex,ey),node)in enumerate(zip(line['points'],points,nodes)):
    close(x,ex,'graph observable x',rtol=1e-12,atol=1e-12);close(y,ey,'graph observable y',rtol=1e-12,atol=1e-12)
    ck(q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],'frame contains point')
    ck(node.get('data-index')==str(i),'point index');close(float(node.get('cx')),xf(x),'circle x',rtol=0,atol=1e-9);close(float(node.get('cy')),yf(y),'circle y',rtol=0,atol=1e-9)
    if coords is not None:close(coords[i][0],xf(x),'line x',rtol=0,atol=1e-9);close(coords[i][1],yf(y),'line y',rtol=0,atol=1e-9)
  markers=root.findall('.//s:line[@data-marker]',ns);has=mode=='contrast'and pi==2 and s['transmission']>0
  ck(len(markers)==len(q['markers'])==int(has),'only defined current transmission marker')
  if has:
   close(q['markers'][0]['x'],math.log10(s['transmission']),'current transmission');close(float(markers[0].get('x1')),xf(q['markers'][0]['x']),'marker pixel',rtol=0,atol=1e-9)
 tables={t['key']:t for t in d['ledgers']};ck(len(tables)==len(d['ledgers']),'unique ledgers')
 matrices={'K':v['K'],'precision':p['precision'],'priorRoot':p['priorRoot'],'augmented':p['augmented'],'augmentedRhs':[[x]for x in p['augmentedRhs']],'projectedRhs':[[x]for x in p['projected']],'QRupper':p['qr']['upper'],'Qt':p['qr']['Qt'],'L':p['L'],'inverseL':p['inverseL'],'covariance':p['covariance'],'gain':p['gain'],'samplingCovariance':v['risk']['covariance']}
 if mode!='contrast':matrices.update({key:v[key]for key in ['Ktrue','held','heldTrue','D','R']})
 wanted={'matrices':[[key,i,j,x]for key,A in matrices.items()for i,row in enumerate(A)for j,x in enumerate(row)],
  'solver':[[i,x,p['shift'][i],p['mean'][i],p['rhs'][i],p['posteriorResidual'][i]]for i,x in enumerate(v['m0'])],
  'reflectors':[[x['k'],i,x['norm'],x['alpha'],a]for x in p['qr']['steps']for i,a in enumerate(x['vector'])]}
 mapping=[('risk',v['risk']['rows'],'i truth expected bias biasSquared samplingVariance mse posteriorVariance'),('noise',v['noise'],'i stage index u v z state1 state2')]
 summary=[mode,s['seed'],s['sigmaData'],s['sigmaFit'],s['lambda'],s['priorMean'],v['calls'],v['lastState'],p['residualNorm'],p['penalty'],p['objective'],max(map(abs,p['posteriorResidual'])),v['risk']['biasSquared'],v['risk']['variance'],v['risk']['mse'],v['risk']['posteriorVariance']]
 if mode=='contrast':
  summary.extend([s['transmission'],s['contrast'],s['priorContrast'],1 if s['transmission']==0 else 2])
  wanted['data']=[[i,x,v['clean'][i],v['data'][i],p['fitted'][i]]for i,x in enumerate(v['truth'])]
  mapping.extend([('modes',v['modes'],'i transmission data truth prior mean analyticMean variance gain resolution leastSquares'),('family',v['family'],'i contrast x0 x1 y0 y1'),('transmissions',v['study'],'k leastSquaresGain regularizedGain resolution')])
 else:
  summary.extend([s['widthTrue'],s['widthFit'],s['order'],v['sourceMSE'],v['trainingCoverage'],v['heldCoverage'],s['draws'],v['ppc']['hits'],v['ppc']['pValue'],v['ppc']['observedMean'],v['ppc']['expectedObserved'],v['ppc']['replicatedMean'],1])
  mapping.extend([('source',v['source'],'i position truth mean variance low high'),('ppc',v['ppc']['rows'],'b observed replicated hit'),('posterior-samples',v['ppc']['samples'],'b i z shift x prediction observed replica replicaNoise'),('study',v['study'],'lambda residualNorm differenceNorm penaltyNorm biasSquared variance mse posteriorVariance actualMSE')])
  wanted['training']=[[x['i'],v['positions'][x['i']],v['clean'][x['i']],v['data'][x['i']],*[x[k]for k in ['mean','latentVariance','variance','latentLow','latentHigh','low','high']]]for x in v['prediction']]
  wanted['heldout']=[[x['i'],v['heldPositions'][x['i']],v['heldClean'][x['i']],v['heldData'][x['i']],*[x[k]for k in ['mean','latentVariance','variance','low','high']]]for x in v['heldPrediction']]
 for key,rows,fields in mapping:wanted[key]=[[x[k]for k in fields.split()]for x in rows]
 ck(set(tables)==set(wanted)|{'summary'},'complete ledger set')
 ck([r[1]for r in tables['summary']['rows']]==summary,'every summary quantity')
 for key,rows in wanted.items():ck(tables[key]['rows']==rows,'every ledger cell '+key)
 for t in tables.values():ck(all(len(r)==len(t['headers'])for r in t['rows']),'header columns')

with localcontext()as ctx:
 ctx.prec=60
 for d in data['states']:verify_state(d);verify_views(d)
ck(data['invalid']>=300,'strict input coverage')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'physics-course/lectures/comp-05-inverse-uncertainty.md').read_text();site=(ROOT/'physics-course/site/comp-05-inverse-uncertainty.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all formulas preserved');ck(all('<'not in v for v in formulas),'math HTML ambiguity absent')
 ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site),'balanced paragraphs')
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack,'no nested disclosure');kind=dict(attrs).get('class');ck(kind in ['answer','page-toc'],'known disclosure');self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack),'summary owned');self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack),'no orphan close');ck(self.stack.pop()[1]==1,'one summary')
 p=Disclosure();p.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(p.answers==4 and not p.stack,'four answers')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'physics-course/site'/target).exists(),('local target',target))
 for course in ['physics-course']:ck((ROOT/course/'site/assets/learning/labs/physics-inverse-uncertainty.js').read_bytes()==JS.read_bytes(),'tracked mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_inverse_full.py')==1,'CI invocation')
 image=ROOT/'physics-course/images/comp-05-inverse-ledgers.svg'
 ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/comp-05-inverse-ledgers.svg').read_bytes(),'SVG mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four static panels')
 code="const a=require(process.argv[1]);console.log(JSON.stringify([a.plots(a.snapshot({mode:'contrast',transmission:0}))[1],a.plots(a.snapshot({}))[0],a.plots(a.snapshot({}))[1],a.plots(a.snapshot({mode:'risk'}))[1]].map(a.svg)))"
 expected=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
 # Math transcendental results can differ by a few ulps across Node/CPU builds.
 # Compare every SVG node and attribute, allowing only sub-nanopixel geometry
 # differences. Text, labels, series identities and point counts remain exact.
 def compare_svg(a,b,path='svg'):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib),('static structure',path))
  ck(a.text==b.text and a.tail==b.tail,('static text',path,a.text,b.text))
  for key,v in a.attrib.items():
   w=b.attrib[key]
   if key in {'x','y','x1','x2','y1','y2','cx','cy','r','width','height'}:
    close(float(v),float(w),('static coordinate',path,key),rtol=0,atol=1e-9)
   elif key in {'points','d'}:
    pattern=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
    ck(re.sub(pattern,'#',v)==re.sub(pattern,'#',w),('static geometry syntax',path,key))
    av=re.findall(pattern,v);bv=re.findall(pattern,w)
    ck(len(av)==len(bv),('static geometry length',path,key))
    for j,(x,y) in enumerate(zip(av,bv)):
     close(float(x),float(y),('static geometry value',path,key,j),rtol=0,atol=1e-9)
   else:ck(v==w,('static attribute',path,key,v,w))
  ck(len(a)==len(b),('static child count',path))
  for j,(x,y) in enumerate(zip(a,b)):compare_svg(x,y,path+'/'+str(j))
 for i,(p,s) in enumerate(zip(panels,expected)):
  e=ET.fromstring(s);p.attrib.pop('x');p.attrib.pop('y')
  compare_svg(p,e,'panel'+str(i))
 # The comparator must accept an ulp-scale coordinate change and reject
 # substantive geometry, missing points, or an altered instructional label.
 original=ET.fromstring('<svg><text x="10">target</text><polyline points="1,2 3,4"/></svg>')
 tiny=ET.fromstring(ET.tostring(original));tiny[0].set('x','10.000000000000002');compare_svg(original,tiny)
 for mutation in ['coordinate','point','label','attribute','node']:
  changed=ET.fromstring(ET.tostring(original))
  if mutation=='coordinate':changed[0].set('x','10.000001')
  elif mutation=='point':changed[1].set('points','1,2')
  elif mutation=='label':changed[0].text='wrong target'
  elif mutation=='attribute':changed[1].set('stroke','red')
  else:changed.remove(changed[1])
  rejected=False
  try:compare_svg(original,changed)
  except AssertionError:rejected=True
  ck(rejected,('static comparator negative control',mutation))
 table=re.search(r'data-learning-lab="physics-inverse-uncertainty".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 t=data['states'][0]['result'];p=t['post'];risk=t['risk']
 refs=[p['residualNorm'],p['penalty'],p['objective'],t['sourceMSE'],risk['biasSquared'],risk['variance'],risk['mse'],risk['posteriorVariance'],t['trainingCoverage'],t['heldCoverage'],t['ppc']['hits'],t['ppc']['pValue'],t['ppc']['expectedObserved'],t['ppc']['expectedReplicated'],t['calls'],t['lastState']]
 ck(len(vals)==len(refs)==16,'fallback complete')
 for v,w in zip(vals,refs):close(v,w,'fallback')
 print('formulas',len(formulas))

print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),invalid=data['invalid'],self=data['self'])))
