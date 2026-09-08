"""Independent complex NumPy SVD + full-spin SciPy exponentials for TEBD."""
from pathlib import Path
import json
import numpy as np
from scipy.linalg import expm
from generate_mps_cache_reference import actH, block_left

def enc(a):
    return np.stack((a.real,a.imag),axis=-1).tolist()

def pair(ts,j):
    return np.einsum('slk,tkr->lstr',ts[j],ts[j+1]).reshape(2*ts[j].shape[1],2*ts[j+1].shape[2])

def split(ts,j,M,rank,direction,normalize):
    dl=ts[j].shape[1];dr=ts[j+1].shape[2]
    U,S,Vh=np.linalg.svd(M,full_matrices=False);rank=min(rank,len(S));q=float(np.sum(S[:rank]**2));total=float(np.sum(S**2));epsilon=float(np.sum(S[rank:]**2)/total)
    if direction==1:A=U[:,:rank];B=S[:rank,None]*Vh[:rank]/(np.sqrt(q) if normalize else 1)
    else:A=U[:,:rank]*S[None,:rank]/(np.sqrt(q) if normalize else 1);B=Vh[:rank]
    ts[j]=A.reshape(dl,2,rank).transpose(1,0,2);ts[j+1]=B.reshape(rank,2,dr).transpose(1,0,2)
    return epsilon

def solve(n,g,chi,T,steps):
    ts=[np.array([np.cos(np.pi/6),np.sin(np.pi/6)],dtype=complex).reshape(2,1,1) for _ in range(n)]
    psi0=block_left(ts)[:,0];dt=T/steps;H=actH(np.eye(2**n),g,n);eig,V=np.linalg.eigh(H)
    z=np.array([n-2*int(b).bit_count() for b in range(2**n)]);HZ=np.diag(-g*z);HXX=H-HZ
    whole=expm(-1j*dt*HZ/2)@expm(-1j*dt*HXX)@expm(-1j*dt*HZ/2)
    gate=expm(1j*dt*np.kron([[0,1],[1,0]],[[0,1],[1,0]]));ref=psi0.copy();hist=[];cuts=[];sumdelta=0;sumep=0
    def field():
        for j in range(n):ts[j]=np.einsum('s,slr->slr',np.exp(1j*g*dt/2*np.array([1,-1])),ts[j])
    for step in range(1,steps+1):
        field()
        for j in range(n-1):
            M=pair(ts,j);dl=ts[j].shape[1];dr=ts[j+1].shape[2]
            theta=np.einsum('uv,lvr->lur',gate,M.reshape(dl,4,dr)).reshape(2*dl,2*dr)
            ep=split(ts,j,theta,chi,1,True);delta=np.sqrt(2*ep/(1+np.sqrt(1-ep)));sumdelta+=delta;sumep+=ep;cuts.append(ep)
        field()
        for j in range(n-2,-1,-1):split(ts,j,pair(ts,j),ts[j].shape[2],-1,False)
        psi=block_left(ts)[:,0];ref=whole@ref;truth=V@(np.exp(-1j*step*dt*eig)*(V.T@psi0));norm=float(np.vdot(psi,psi).real)
        hist.append(dict(step=step,norm=norm,E=float(np.vdot(psi,H@psi).real/norm),magnet=float(np.vdot(psi,z*psi).real/n/norm),trotter=float(np.linalg.norm(ref-truth)),compression=float(np.linalg.norm(psi-ref)),total=float(np.linalg.norm(psi-truth)),sumDelta=float(sumdelta),sumEpsilon=float(sumep)))
    assert np.linalg.norm(truth-expm(-1j*T*H)@psi0)<1e-11
    return dict(n=n,g=g,chi=chi,T=T,steps=steps,history=hist,epsilon=cuts)

if __name__=='__main__':
    cases=[solve(n,g,chi,1,10) for n in (4,6) for g in (.5,1,2) for chi in (1,2,4)]
    cases.extend(solve(4,1,4,1,k) for k in (8,16,32));cases.append(solve(6,1,8,2,32));cases.append(solve(6,2,2,2,2))
    rng=np.random.default_rng(2104);matrices=[]
    for n,m in ((2,3),(3,2),(4,6),(6,4),(5,5)):
        M=rng.normal(size=(n,m))+1j*rng.normal(size=(n,m));U,S,V=np.linalg.svd(M,full_matrices=False)
        matrices.append(dict(M=enc(M),weights=(S*S).tolist()))
    target=Path(__file__).parent/'fixtures'/'tebd-numpy.json';target.write_text(json.dumps(dict(cases=cases,matrices=matrices),separators=(',',':'))+'\n');print(f'Wrote {len(cases)} complex TEBD and {len(matrices)} SVD references')
