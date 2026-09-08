"""Independent NumPy SVD fit and full calendar-kernel covariance from original TXT."""
import itertools
import json
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
raw=np.loadtxt(ROOT/'course-shared/projects/co2-observations/co2_mm_mlo_2026-08-05.txt')
raw=raw[(raw[:,0]>=1990)&(raw[:,0]<=2021)]
results=[]
for start,model,lag,days in itertools.product([1990,2010,2015],[0,1,2],[0,6,12,24],[0,25]):
    valid=(raw[:,5]>=days)&(raw[:,6]>=0)&(raw[:,7]>=0)
    train=raw[valid&(raw[:,0]>=start)&(raw[:,0]<=2019)]
    test=raw[valid&(raw[:,0]>=2020)]
    center=(start+2020)/2
    def design(rows):
        t=rows[:,2];x=t-center
        columns=[np.ones(len(t)),x]
        if model:
            columns.extend([np.sin(2*np.pi*t),np.cos(2*np.pi*t),np.sin(4*np.pi*t),np.cos(4*np.pi*t)])
        if model==2:
            columns.append(x*x)
        return np.array(columns).T
    X=design(train);Y=design(test);y=train[:,3];n,p=X.shape
    beta,_,rank,_=np.linalg.lstsq(X,y,rcond=None)
    assert rank==p
    pinv=np.linalg.pinv(X);bread=pinv@pinv.T
    residual=y-X@beta
    months=(12*train[:,0]+train[:,1]-1).astype(int)
    gaps=np.abs(months[:,None]-months[None,:])
    kernel=np.maximum(0,1-gaps/(lag+1))
    scores=X*residual[:,None]
    cov=bread@scores.T@kernel@scores@bread*n/(n-p)
    assert np.linalg.eigvalsh(cov).min()>-1e-10
    pairs=np.where(np.diff(months)==1)[0]
    corr=float(np.corrcoef(residual[pairs],residual[pairs+1])[0,1])
    results.append(dict(start=start,model=model,lag=lag,days=days,n=n,p=p,beta=beta.tolist(),cov=cov.tolist(),
        iidSE=float(np.sqrt((residual@residual)/(n-p)*bread[1,1])),hacSE=float(np.sqrt(cov[1,1])),
        trainRMSE=float(np.sqrt(np.mean(residual**2))),testRMSE=float(np.sqrt(np.mean((test[:,3]-Y@beta)**2))),lag1=corr,pairCount=len(pairs),testN=len(test)))
target=ROOT/'tools/fixtures/co2-numpy.json'
target.write_text(json.dumps({'method':'NumPy SVD from original TXT; full Bartlett calendar kernel matrix','cases':results},indent=2)+'\n')
print(f'PASS: {len(results)} independent NOAA trend fits and full covariance matrices')
