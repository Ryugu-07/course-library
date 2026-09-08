"""NumPy full-spin references for tensor H squared; no MPO operations used."""
from pathlib import Path
import json
import numpy as np
from generate_mps_cache_reference import actH, block_left

def as_mps(psi,n):
    M=psi.reshape(1,-1);ts=[];dl=1
    for j in range(n-1):
        U,S,V=np.linalg.svd(M.reshape(dl*2,-1),full_matrices=False)
        rank=len(S);ts.append(U.reshape(dl,2,rank).transpose(1,0,2));M=S[:,None]*V;dl=rank
    ts.append(M.reshape(dl,2,1).transpose(1,0,2))
    return ts

def record(ts,g,label):
    n=len(ts);psi=block_left(ts)[:,0];hpsi=actH(psi[:,None],g,n)[:,0];norm=float(psi@psi)
    E=float(psi@hpsi/norm);h2=float(hpsi@hpsi/norm);res=hpsi-E*psi
    parity=np.array([(-1)**int(b).bit_count() for b in range(2**n)])
    return dict(label=label,g=g,tensors=[a.tolist() for a in ts],norm=norm,E=E,H2=h2,variance=float(res@res/norm),parity=float((psi*parity)@psi/norm))

if __name__=='__main__':
    rng=np.random.default_rng(190320);cases=[]
    for n in (2,4,6):
        for g in (.5,1.,2.):
            bonds=[1]+[min(3,2**min(j,n-j)) for j in range(1,n)]+[1]
            ts=[rng.normal(size=(2,bonds[j],bonds[j+1]))/np.sqrt(2*bonds[j]) for j in range(n)]
            cases.append(record(ts,g,f'random-{n}-{g}'))
            H=actH(np.eye(2**n),g,n);vals,vecs=np.linalg.eigh(H)
            for index in (0,1,2**n-1):
                ts=as_mps(vecs[:,index],n);ts[0]*=2.3
                cases.append(record(ts,g,f'eigen-{n}-{g}-{index}'))
    target=Path(__file__).parent/'fixtures'/'variance-numpy.json'
    target.write_text(json.dumps(cases,separators=(',',':'))+'\n')
    print(f'Wrote {len(cases)} full-spin references to {target}')
