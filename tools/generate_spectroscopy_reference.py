"""Independent dense circular forward matrix and SVD Tikhonov references."""
from pathlib import Path
import json
import numpy as np
N=96
x=-3+6*np.arange(N)/N
rows=[]
for sigma in [.08,.18,.38]:
    z=np.where(np.arange(N)<=N/2,np.arange(N),np.arange(N)-N)*6/N
    kernel=np.exp(-.5*(z/sigma)**2);kernel/=kernel.sum()
    matrix=kernel[(np.arange(N)[:,None]-np.arange(N)[None,:])%N]
    u,sv,vh=np.linalg.svd(matrix)
    for noise in [0,.12]:
        truth=np.exp(-.5*((x+.275)/.045)**2)+np.exp(-.5*((x-.275)/.045)**2)
        blurred=matrix@truth
        observed=blurred+noise*(.7*np.sin(2.5*x+.4)+.35*np.sin(8.7*x-.2))/1.05
        for lam in [0,.005,.02,.25]:
            reliable=lam>0 or sv[-1]>64*np.finfo(float).eps*N*sv[0]
            rec=vh.T@((sv/(sv**2+lam))*(u.T@observed)) if reliable else None
            rows.append(dict(config=dict(separation=.55,psfSigma=sigma,noise=noise,regularization=lam),blurred=blurred.tolist(),reconstruction=None if rec is None else rec.tolist(),singularMin=float(sv[-1])))
out=Path(__file__).parent/'fixtures/spectroscopy-svd.json'
out.write_text(json.dumps(dict(numpy=np.__version__,method='full 96x96 circular matrix with dense SVD',rows=rows),indent=2)+'\n')
print(len(rows),'dense matrix references')
