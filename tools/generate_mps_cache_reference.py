"""Independent small-chain reference: explicitly embed block states, never use G/K/C caches."""
from pathlib import Path
import json
import numpy as np

def block_left(ts):
    b=np.ones((1,1))
    for A in ts:
        b=np.einsum('pl,slr->psr',b,A).reshape(-1,A.shape[2])
    return b

def block_right(ts):
    b=np.ones((1,1))
    for A in reversed(ts):
        b=np.einsum('slr,pr->spl',A,b).reshape(-1,A.shape[1])
    return b

def actH(V,g,n):
    bits=np.arange(2**n)
    z=np.array([n-2*int(x).bit_count() for x in bits])
    out=-g*z[:,None]*V
    for j in range(n-1):out-=V[bits^((1<<(n-1-j))|(1<<(n-2-j)))]
    return out

def solve(n,g,chi,rounds):
    ts=[np.array([np.cos(np.pi/6),np.sin(np.pi/6)]).reshape(2,1,1) for _ in range(n)]
    hist=[]
    for _ in range(rounds):
        for direction in (1,-1):
            for j in (range(n-1) if direction==1 else range(n-2,-1,-1)):
                L,R=block_left(ts[:j]),block_right(ts[j+2:]);dl,dr=L.shape[1],R.shape[1]
                W=np.kron(np.kron(L,np.eye(4)),R)
                H=W.T@actH(W,g,n)
                old=np.einsum('slk,tkr->lstr',ts[j],ts[j+1]).reshape(-1)
                before=float(old@H@old/(old@old))
                vals,vecs=np.linalg.eigh(H);M=vecs[:,0].reshape(2*dl,2*dr)
                U,S,Vh=np.linalg.svd(M,full_matrices=False);r=min(chi,len(S));eps=float(np.sum(S[r:]**2));q=float(np.sum(S[:r]**2))
                if direction==1:A=U[:,:r];B=S[:r,None]*Vh[:r]/np.sqrt(q)
                else:A=U[:,:r]*S[None,:r]/np.sqrt(q);B=Vh[:r]
                ts[j]=A.reshape(dl,2,r).transpose(1,0,2);ts[j+1]=B.reshape(r,2,dr).transpose(1,0,2)
                v=(A@B).reshape(-1);energy=float(v@H@v/(v@v))
                hist.append(dict(bond=j+1,direction=direction,dimension=len(H),before=before,optimized=float(vals[0]),E=energy,epsilon=eps))
    psi=block_left(ts)[:,0];E=float(psi@actH(psi[:,None],g,n)[:,0]/(psi@psi))
    T=np.diag([g]*n)+np.diag([-1.]*(n-1),-1);ground=-float(np.linalg.svd(T,compute_uv=False).sum())
    return dict(length=n,g=g,chi=chi,rounds=rounds,E=E,ground=ground,history=hist)

if __name__=='__main__':
    cases=[solve(n,g,chi,2) for n in (4,6,8) for g in (.5,1,2) for chi in (1,2,4)]
    cases.extend(solve(12,1,chi,2) for chi in (2,4))
    target=Path(__file__).parent/'fixtures'/'mps-cache-numpy.json'
    target.write_text(json.dumps(cases,separators=(',',':'))+'\n')
    print(f'Wrote {len(cases)} independent full-space histories: {target}')
