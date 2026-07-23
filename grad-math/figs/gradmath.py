import sys; sys.path.insert(0,"/Users/karasuakamatsu/grad-math/figs")
from _common import *
rng=np.random.default_rng(5)

def f_subgaussian():
    t=np.linspace(0,3.5,300); fig,ax=plt.subplots(figsize=(6.4,3.8))
    ax.semilogy(t,2*np.exp(-t**2/2),color=ACC,lw=2.2,label=r"sub-Gaussian bound $2e^{-t^2/2}$")
    ax.semilogy(t,2*np.exp(-t),color=RED,lw=2,ls="--",label=r"sub-exponential $2e^{-t}$")
    ax.semilogy(t,1/(1+t**2),color=GREEN,lw=2,ls=":",label=r"heavy tail $1/(1+t^2)$")
    ax.set_xlabel(r"$t$"); ax.set_ylabel(r"$P(|X|>t)$"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Tail decay: sub-Gaussian concentrates fastest",fontsize=12)
    save(fig,"hdp-01-subgaussian-tail")

def f_semicircle():
    N=800; A=rng.normal(0,1,(N,N)); A=(A+A.T)/np.sqrt(2*N); ev=np.linalg.eigvalsh(A)
    fig,ax=plt.subplots(figsize=(6.4,3.8))
    ax.hist(ev,bins=60,density=True,color=ACC2,alpha=.7,edgecolor=ACC,lw=.5)
    x=np.linspace(-2,2,200); ax.plot(x,np.sqrt(np.clip(4-x**2,0,None))/(2*np.pi),color=RED,lw=2.2,label="semicircle law")
    ax.set_xlabel("eigenvalue"); ax.set_ylabel("density"); ax.legend(frameon=False,fontsize=11)
    ax.set_title(r"Wigner semicircle: spectrum of a random symmetric matrix",fontsize=12)
    save(fig,"hdp-03-semicircle")

def f_concentration_sphere():
    dims=[2,5,20,100]; fig,ax=plt.subplots(figsize=(6.4,3.8))
    x=np.linspace(-1,1,300)
    for d,c in zip(dims,[ACC2,"#9575b5","#7a5aa0",ACC]):
        # marginal of uniform on sphere S^{d-1} ~ (1-x^2)^{(d-3)/2}
        pdf=(1-x**2)**((d-3)/2); pdf/=np.trapezoid(pdf,x)
        ax.plot(x,pdf,color=c,lw=2,label=fr"$d={d}$")
    ax.set_xlabel(r"coordinate $x_1$"); ax.set_ylabel("density"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"High-dim sphere: mass concentrates near the equator",fontsize=12)
    save(fig,"hdp-02-concentration")

def f_value_iteration():
    gam=0.9; err0=1.0; k=np.arange(0,40); err=err0*gam**k
    fig,ax=plt.subplots(figsize=(6.2,3.8))
    ax.semilogy(k,err,"o-",color=ACC,ms=4,label=r"$\Vert V_k-V^*\Vert\leq\gamma^k\Vert V_0-V^*\Vert$")
    ax.set_xlabel(r"iteration $k$"); ax.set_ylabel(r"error (log)"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Value iteration: contraction $\Rightarrow$ geometric convergence",fontsize=12)
    save(fig,"mdp-02-value-iteration")

def f_conjugate():
    x=np.linspace(-2,2.5,300); f=lambda t:t**2/2
    fig,ax=plt.subplots(figsize=(6.2,3.8)); ax.plot(x,f(x),color=ACC,lw=2.2,label=r"$f(x)=x^2/2$")
    for s in [-1,0.5,1.5]:
        ax.plot(x,s*x-f(s)*0+s*x-(s**2/2),color=GRID,lw=1,ls="--")
    ax.plot(x,1.5*x-(1.5**2/2),color=RED,lw=1.6,label=r"supporting line slope $s$")
    ax.text(1.0,-1.2,r"$f^*(s)=\sup_x(sx-f(x))$",color=RED,fontsize=11)
    ax.set_ylim(-2,3); ax.set_xlabel(r"$x$"); ax.legend(frameon=False,fontsize=10,loc="upper center")
    ax.set_title(r"Fenchel conjugate: steepest supporting line at slope $s$",fontsize=12)
    save(fig,"cvx-01-conjugate")

def f_rates():
    k=np.arange(1,100); fig,ax=plt.subplots(figsize=(6.2,3.8))
    ax.loglog(k,1/k,color=ACC,lw=2,label=r"GD (convex) $O(1/k)$")
    ax.loglog(k,1/k**2,color=RED,lw=2,label=r"Nesterov $O(1/k^2)$")
    ax.loglog(k,0.85**k,color=GREEN,lw=2,label=r"GD (strongly convex) linear")
    ax.set_xlabel(r"iteration $k$"); ax.set_ylabel(r"suboptimality"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"First-order convergence rates",fontsize=12)
    save(fig,"cvx-02-rates")

def f_svd_lowrank():
    rng2=np.random.default_rng(0); n=60
    U,_=np.linalg.qr(rng2.normal(size=(n,n))); V,_=np.linalg.qr(rng2.normal(size=(n,n)))
    s=np.exp(-np.arange(n)/8); A=U@np.diag(s)@V.T
    ks=np.arange(1,31); err=[np.sqrt(np.sum(s[k:]**2)) for k in ks]
    fig,ax=plt.subplots(figsize=(6.2,3.8))
    ax.semilogy(ks,err,"o-",color=ACC,ms=4)
    ax.set_xlabel(r"rank $k$"); ax.set_ylabel(r"$\|A-A_k\|_F$ (log)")
    ax.set_title(r"SVD low-rank approx error $=\sqrt{\sum_{i>k}\sigma_i^2}$ (Eckart–Young)",fontsize=11)
    save(fig,"nla-01-svd-lowrank")

def f_perron():
    P=np.array([[0.6,0.3,0.2],[0.3,0.5,0.3],[0.1,0.2,0.5]])
    v=np.array([1.0,0,0]); hist=[v.copy()]
    for _ in range(15): v=P@v; v=v/v.sum(); hist.append(v.copy())
    hist=np.array(hist); w,vec=np.linalg.eig(P); pf=np.real(vec[:,np.argmax(w)]); pf/=pf.sum()
    fig,ax=plt.subplots(figsize=(6.2,3.8))
    for j,c in zip(range(3),[ACC,RED,GREEN]):
        ax.plot(hist[:,j],"o-",color=c,ms=4,label=fr"comp {j+1}"); ax.axhline(pf[j],color=c,lw=1,ls="--",alpha=.6)
    ax.set_xlabel(r"power iteration $k$"); ax.set_ylabel("normalized vector"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Perron–Frobenius: power iteration $\to$ dominant eigenvector",fontsize=12)
    save(fig,"ma-03-perron")

def f_aep():
    n=np.arange(1,200); p=0.3; H=-p*np.log2(p)-(1-p)*np.log2(1-p)
    fig,ax=plt.subplots(figsize=(6.2,3.6))
    ax.plot(n,2.0**(n*H),color=ACC,lw=2,label=r"typical set $\approx 2^{nH}$")
    ax.plot(n,2.0**(n*1.0),color=GRID,lw=1.6,ls="--",label=r"all sequences $2^n$")
    ax.set_yscale("log"); ax.set_xlabel(r"block length $n$"); ax.set_ylabel("count (log)"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"AEP: probability concentrates on $2^{nH}$ typical sequences",fontsize=12)
    save(fig,"it2-01-aep")

def f_sinkhorn():
    n=40; x=np.linspace(0,1,n)
    a=np.exp(-((x-0.3)/0.12)**2)+0.5*np.exp(-((x-0.7)/0.1)**2); a/=a.sum()
    b=np.exp(-((x-0.55)/0.18)**2); b/=b.sum()
    C=(x[:,None]-x[None,:])**2
    K=np.exp(-C/0.02); u=np.ones(n); v=np.ones(n)
    for _ in range(200): u=a/(K@v); v=b/(K.T@u)
    Pi=np.diag(u)@K@np.diag(v)
    fig,ax=plt.subplots(figsize=(5.2,4.6))
    im=ax.imshow(Pi,origin="lower",cmap="Purples",extent=[0,1,0,1],aspect="auto")
    ax.plot(x,0.05+0.1*a/a.max(),color=RED,lw=1.5); ax.plot(0.05+0.1*b/b.max(),x,color=ACC,lw=1.5)
    ax.set_xlabel(r"target $\nu$"); ax.set_ylabel(r"source $\mu$")
    ax.set_title(r"Entropic OT (Sinkhorn): the coupling $\pi$",fontsize=12)
    save(fig,"ot-03-sinkhorn")

def f_wasserstein_interp():
    x=np.linspace(-4,6,400); fig,ax=plt.subplots(figsize=(6.6,3.6))
    g=lambda x,m,s: np.exp(-(x-m)**2/(2*s**2))/(s*np.sqrt(2*np.pi))
    for t,al in zip([0,0.25,0.5,0.75,1.0],np.linspace(1,.4,5)):
        m=(1-t)*0+t*4; s=(1-t)*0.6+t*1.0
        ax.plot(x,g(x,m,s),color=ACC,alpha=al,lw=2)
    ax.set_xlabel(r"$x$"); ax.set_ylabel("density")
    ax.set_title(r"Wasserstein geodesic: displacement interpolation of two Gaussians",fontsize=11)
    save(fig,"ot-02-wasserstein-interp")

def f_geodesic():
    from mpl_toolkits.mplot3d import Axes3D  # noqa
    fig=plt.figure(figsize=(5.0,4.6)); ax=fig.add_subplot(111,projection="3d")
    u=np.linspace(0,2*np.pi,40); v=np.linspace(0,np.pi,20)
    ax.plot_surface(np.outer(np.cos(u),np.sin(v)),np.outer(np.sin(u),np.sin(v)),
                    np.outer(np.ones_like(u),np.cos(v)),color=ACC2,alpha=.25,linewidth=0)
    t=np.linspace(0,1,50); 
    # great circle between two points
    p1=np.array([1,0,0.2]); p1=p1/np.linalg.norm(p1); p2=np.array([0,1,0.2]); p2=p2/np.linalg.norm(p2)
    om=np.arccos(p1@p2); gc=np.array([(np.sin((1-tt)*om)*p1+np.sin(tt*om)*p2)/np.sin(om) for tt in t])
    ax.plot(gc[:,0],gc[:,1],gc[:,2],color=RED,lw=2.5,label="geodesic (great circle)")
    ax.plot([p1[0],p2[0]],[p1[1],p2[1]],[p1[2],p2[2]],color=GRID,lw=1.5,ls="--")
    ax.set_axis_off(); ax.legend(frameon=False,fontsize=10); ax.set_title(r"Geodesic on a sphere = great circle arc",fontsize=12)
    ax.view_init(28,35); save(fig,"mfld-03-geodesic")

if __name__=="__main__":
    for fn in [f_subgaussian,f_semicircle,f_concentration_sphere,f_value_iteration,f_conjugate,
               f_rates,f_svd_lowrank,f_perron,f_aep,f_sinkhorn,f_wasserstein_interp,f_geodesic]:
        try: fn()
        except Exception as e: print("✗",fn.__name__,"→",repr(e))
