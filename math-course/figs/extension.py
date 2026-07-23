import sys; sys.path.insert(0,"/Users/karasuakamatsu/math-course/figs")
from _common import *

def f_entropy():
    p=np.linspace(1e-6,1-1e-6,400); H=-p*np.log2(p)-(1-p)*np.log2(1-p)
    fig,ax=plt.subplots(figsize=(6.0,3.8)); ax.plot(p,H,color=ACC,lw=2.4)
    ax.plot([0.5],[1],"o",color=RED,ms=7); ax.text(0.5,1.04,r"max $=1$ bit at $p=0.5$",ha="center",color=RED,fontsize=11)
    ax.set_xlabel(r"$p$"); ax.set_ylabel(r"$H(p)$ (bits)"); ax.set_ylim(0,1.15)
    ax.set_title(r"Binary entropy $H(p)=-p\log p-(1-p)\log(1-p)$",fontsize=12)
    save(fig,"info-01-entropy")

def f_quadratic_variation():
    r=np.random.default_rng(3); n=2000; t=np.linspace(0,1,n); dW=r.normal(0,np.sqrt(t[1]),n-1)
    W=np.concatenate([[0],np.cumsum(dW)]); QV=np.concatenate([[0],np.cumsum(dW**2)])
    fig,ax=plt.subplots(figsize=(6.6,3.8))
    ax.plot(t,W,color=ACC,lw=1.2,label=r"$W_t$ (Brownian path)")
    ax.plot(t,QV,color=RED,lw=2,label=r"quadratic variation $\sum(\Delta W)^2$")
    ax.plot(t,t,color=INK,lw=1.2,ls="--",label=r"$t$")
    ax.set_xlabel(r"$t$"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"$[W]_t=t$: Brownian quadratic variation is deterministic",fontsize=12)
    save(fig,"sde-01-quadratic-variation")

def f_diffusion():
    r=np.random.default_rng(1); N=8000
    x0=np.concatenate([r.normal(-2,0.35,N//2),r.normal(2,0.35,N//2)])  # bimodal data
    fig,axes=plt.subplots(1,4,figsize=(10.2,2.8),sharey=True,sharex=True)
    for ax,t,lab in zip(axes,[0,0.3,0.6,1.0],["data $t{=}0$","$t$","$t$","noise $t{=}T$"]):
        xt=np.sqrt(1-t)*x0+np.sqrt(t)*r.normal(0,1.6,N)
        ax.hist(xt,bins=60,density=True,color=ACC,alpha=.8)
        ax.set_title(lab,fontsize=11); ax.set_xlim(-5,5); ax.set_yticks([])
    fig.suptitle(r"Forward diffusion: data distribution $\to$ Gaussian noise",fontsize=11,y=1.05)
    save(fig,"sde-02-diffusion")

def f_gbm_payoff():
    fig,axes=plt.subplots(1,2,figsize=(9.0,3.6))
    ax=axes[0]; r=np.random.default_rng(5); n=250; t=np.linspace(0,1,n); mu,sig=0.06,0.3
    for s in range(6):
        rr=np.random.default_rng(s); dW=rr.normal(0,np.sqrt(t[1]),n-1)
        W=np.concatenate([[0],np.cumsum(dW)])
        S=100*np.exp((mu-sig**2/2)*t+sig*W); ax.plot(t,S,lw=1.2,alpha=.85)
    ax.axhline(100,color=INK,lw=.8,ls="--")
    ax.set_xlabel(r"$t$"); ax.set_ylabel(r"$S_t$"); ax.set_title(r"GBM price paths $dS=\mu S\,dt+\sigma S\,dW$",fontsize=11)
    ax=axes[1]; ST=np.linspace(60,140,200); K=100
    ax.plot(ST,np.maximum(ST-K,0),color=ACC,lw=2.4)
    ax.axvline(K,color=GRID,lw=1,ls=":"); ax.text(K+1,25,r"$K$",color="#666")
    ax.set_xlabel(r"$S_T$"); ax.set_ylabel("payoff"); ax.set_title(r"Call option payoff $\max(S_T-K,0)$",fontsize=11)
    save(fig,"sde-03-gbm-payoff")

def f_ar_process():
    r=np.random.default_rng(2); n=200; fig,ax=plt.subplots(figsize=(6.8,3.6))
    for phi,c,lab in [(0.3,ACC2,r"$\phi=0.3$ (fast revert)"),(0.9,ACC,r"$\phi=0.9$ (persistent)"),(1.0,RED,r"$\phi=1$ (random walk)")]:
        x=[0]
        for _ in range(n): x.append(phi*x[-1]+r.normal(0,1))
        ax.plot(x,color=c,lw=1.3,label=lab)
    ax.axhline(0,color=INK,lw=.8)
    ax.set_xlabel(r"$t$"); ax.set_ylabel(r"$x_t$"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"AR(1) $x_t=\phi x_{t-1}+\epsilon_t$: $\phi$ controls memory",fontsize=12)
    save(fig,"ts-01-ar-process")

def f_garch():
    r=np.random.default_rng(11); n=600; om,al,be=0.05,0.12,0.85
    sig2=np.zeros(n); ret=np.zeros(n); sig2[0]=om/(1-al-be)
    for t in range(1,n):
        sig2[t]=om+al*ret[t-1]**2+be*sig2[t-1]; ret[t]=np.sqrt(sig2[t])*r.normal()
    fig,ax=plt.subplots(2,1,figsize=(6.8,4.4),sharex=True)
    ax[0].plot(ret,color=ACC,lw=.8); ax[0].set_ylabel("return"); ax[0].set_title("GARCH: volatility clustering",fontsize=12)
    ax[1].plot(np.sqrt(sig2),color=RED,lw=1.2); ax[1].set_ylabel(r"$\sigma_t$"); ax[1].set_xlabel(r"$t$")
    save(fig,"ts-02-garch")

if __name__=="__main__":
    for fn in [f_entropy,f_quadratic_variation,f_diffusion,f_gbm_payoff,f_ar_process,f_garch]:
        try: fn()
        except Exception as e: print("✗",fn.__name__,"→",repr(e))
