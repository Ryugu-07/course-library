# 概率统计线 plot 图（图内英文/数学；中文进 figcaption）
import sys; sys.path.insert(0,"/Users/karasuakamatsu/math-course/figs")
from _common import *
from math import comb, factorial, erf, sqrt, pi, exp
rng=np.random.default_rng(7)

def f_distributions():
    fig,axes=plt.subplots(1,2,figsize=(8.6,3.6))
    x=np.linspace(-4,7,400)
    ax=axes[0]
    ax.plot(x,np.exp(-x**2/2)/np.sqrt(2*pi),color=ACC,lw=2,label=r"Normal $\mathcal{N}(0,1)$")
    ax.plot(x,np.where(x>=0,np.exp(-x),0),color=RED,lw=2,label=r"Exponential $\lambda=1$")
    ax.set_title("Continuous densities",fontsize=12); ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$f(x)$")
    ax.legend(frameon=False,fontsize=10)
    ax=axes[1]; k=np.arange(0,15)
    binom=[comb(14,i)*0.4**i*0.6**(14-i) for i in k]
    pois=[exp(-4)*4**i/factorial(i) for i in k]
    ax.bar(k-0.18,binom,width=.36,color=ACC,alpha=.8,label=r"Binomial $n{=}14,p{=}0.4$")
    ax.bar(k+0.18,pois,width=.36,color=RED,alpha=.7,label=r"Poisson $\lambda{=}4$")
    ax.set_title("Discrete mass functions",fontsize=12); ax.set_xlabel(r"$k$"); ax.set_ylabel(r"$P(X=k)$")
    ax.legend(frameon=False,fontsize=10)
    save(fig,"prob-02-distributions")

def f_bivariate_normal():
    x=np.linspace(-3,3,200); X,Y=np.meshgrid(x,x); rho=0.6
    Z=np.exp(-(X**2-2*rho*X*Y+Y**2)/(2*(1-rho**2)))
    fig,ax=plt.subplots(figsize=(5.2,4.6))
    ax.contour(X,Y,Z,levels=7,cmap="Blues")
    ax.set_aspect("equal"); ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$y$")
    ax.set_title(r"Bivariate normal, $\rho=0.6$: tilted ellipses",fontsize=12)
    save(fig,"prob-03-bivariate-normal")

def f_clt():
    fig,ax=plt.subplots(figsize=(6.8,3.8))
    for n,c,al in [(1,ACC2,.9),(2,"#6f8bc4",.9),(5,ACC,.9),(30,INK,.9)]:
        s=rng.uniform(0,1,(20000,n)).mean(axis=1)
        s=(s-0.5)/(np.sqrt(1/12/n))
        ax.hist(s,bins=60,density=True,histtype="step",color=c,lw=1.8,label=f"$n={n}$")
    xx=np.linspace(-4,4,200); ax.plot(xx,np.exp(-xx**2/2)/np.sqrt(2*pi),color=RED,lw=2,ls="--",label=r"$\mathcal{N}(0,1)$")
    ax.set_xlim(-4,4); ax.set_xlabel(r"standardized mean"); ax.set_ylabel("density")
    ax.legend(frameon=False,fontsize=10); ax.set_title("CLT: mean of $n$ uniforms $\\to$ normal",fontsize=12)
    save(fig,"prob-05-clt")

def f_sampling_dists():
    from math import gamma
    x=np.linspace(0.01,10,400); fig,axes=plt.subplots(1,2,figsize=(8.6,3.6))
    ax=axes[0]
    for k,c in [(2,ACC2),(4,ACC),(6,INK)]:
        ax.plot(x,x**(k/2-1)*np.exp(-x/2)/(2**(k/2)*gamma(k/2)),color=c,lw=2,label=fr"$k={k}$")
    ax.set_title(r"$\chi^2_k$",fontsize=12); ax.set_xlabel(r"$x$"); ax.legend(frameon=False,fontsize=10); ax.set_ylim(0,.5)
    ax=axes[1]; t=np.linspace(-5,5,400)
    ax.plot(t,np.exp(-t**2/2)/np.sqrt(2*pi),color=RED,lw=2,ls="--",label=r"$\mathcal{N}(0,1)$")
    for df,c in [(1,ACC2),(3,ACC),(10,INK)]:
        ax.plot(t,gamma((df+1)/2)/(np.sqrt(df*pi)*gamma(df/2))*(1+t**2/df)**(-(df+1)/2),color=c,lw=1.8,label=fr"$t_{{{df}}}$")
    ax.set_title(r"Student $t$: heavy tails $\to$ normal",fontsize=12); ax.set_xlabel(r"$t$"); ax.legend(frameon=False,fontsize=9)
    save(fig,"stat-01-sampling-dists")

def f_confidence():
    fig,ax=plt.subplots(figsize=(6.4,4.2)); mu=0
    for i in range(20):
        s=rng.normal(mu,1,25); m=s.mean(); h=1.96/np.sqrt(25)
        covered = (m-h<=mu<=m+h)
        ax.errorbar(m,i,xerr=h,fmt="o",ms=3,color=(ACC if covered else RED),
                    ecolor=(ACC if covered else RED),capsize=2,lw=1.2)
    ax.axvline(mu,color=INK,lw=1.2,ls="--"); ax.text(0.05,20,r"true $\mu$",color=INK,fontsize=11)
    ax.set_yticks([]); ax.set_xlabel(r"$\bar{x}\pm 1.96\,\sigma/\sqrt{n}$")
    ax.set_title(r"95% CI: about 1 in 20 misses (red)",fontsize=12)
    save(fig,"stat-03-confidence")

def f_hypothesis():
    x=np.linspace(-4,7,500); n=lambda x,m:np.exp(-(x-m)**2/2)/np.sqrt(2*pi)
    fig,ax=plt.subplots(figsize=(6.8,3.8)); c=1.96
    ax.plot(x,n(x,0),color=ACC,lw=2,label=r"$H_0$"); ax.plot(x,n(x,3),color=RED,lw=2,label=r"$H_1$")
    ax.fill_between(x,n(x,0),where=x>c,color=ACC,alpha=.35)
    ax.fill_between(x,n(x,3),where=x<c,color=RED,alpha=.25)
    ax.axvline(c,color=INK,lw=1,ls="--"); ax.text(c+.05,.38,"reject region",fontsize=10)
    ax.text(2.3,.03,r"$\alpha$",color=ACC,fontsize=13); ax.text(0.7,.03,r"$\beta$",color=RED,fontsize=13)
    ax.set_xlabel(r"test statistic"); ax.set_ylabel("density"); ax.legend(frameon=False,fontsize=11)
    ax.set_title(r"Type I ($\alpha$) vs Type II ($\beta$) error",fontsize=12)
    save(fig,"stat-04-hypothesis")

def f_regression():
    x=rng.uniform(0,10,40); y=1.2*x+2+rng.normal(0,2.2,40)
    b1=np.cov(x,y,bias=True)[0,1]/np.var(x); b0=y.mean()-b1*x.mean()
    fig,ax=plt.subplots(figsize=(6.4,4.0)); ax.plot(x,y,"o",color=INK,ms=5)
    xs=np.linspace(0,10,10); ax.plot(xs,b0+b1*xs,color=ACC,lw=2,label=r"$\hat{y}=\hat\beta_0+\hat\beta_1 x$")
    for xi,yi in zip(x,y): ax.plot([xi,xi],[yi,b0+b1*xi],color=RED,lw=.8,alpha=.6)
    ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$y$"); ax.legend(frameon=False,fontsize=11)
    ax.set_title(r"Least squares: minimize $\sum$ residuals$^2$ (red)",fontsize=12)
    save(fig,"stat-05-regression")

def f_poisson_process():
    fig,ax=plt.subplots(figsize=(6.8,3.6))
    for seed,c in [(1,ACC),(2,RED),(3,GREEN)]:
        r=np.random.default_rng(seed); t=np.cumsum(r.exponential(1,15)); t=t[t<12]
        ts=np.concatenate([[0],np.repeat(t,2),[12]]); ys=np.repeat(np.arange(len(t)+1),2)
        ax.step(np.concatenate([[0],t,[12]]),np.arange(len(t)+2)[:len(t)+2],where="post",color=c,lw=1.8,alpha=.85)
    ax.set_xlabel(r"$t$"); ax.set_ylabel(r"$N(t)$"); ax.set_title(r"Poisson process: rate-$\lambda$ counting paths",fontsize=12)
    save(fig,"stoch-01-poisson-process")

def f_markov_converge():
    P=np.array([[0.7,0.2,0.1],[0.1,0.8,0.1],[0.2,0.3,0.5]])
    d=np.array([1.0,0,0]); hist=[d.copy()]
    for _ in range(12): d=d@P; hist.append(d.copy())
    hist=np.array(hist)
    # stationary
    w,v=np.linalg.eig(P.T); pi_=np.real(v[:,np.argmin(abs(w-1))]); pi_/=pi_.sum()
    fig,ax=plt.subplots(figsize=(6.8,3.8))
    for j,c in zip(range(3),[ACC,RED,GREEN]):
        ax.plot(hist[:,j],"o-",color=c,ms=4,label=fr"state {j+1}")
        ax.axhline(pi_[j],color=c,lw=1,ls="--",alpha=.6)
    ax.set_xlabel(r"step $n$"); ax.set_ylabel(r"$P(X_n=j)$"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Markov chain $\to$ stationary $\pi$ (dashed)",fontsize=12)
    save(fig,"stoch-02-markov-converge")

def f_brownian():
    fig,ax=plt.subplots(figsize=(6.8,3.8)); t=np.linspace(0,1,500)
    for seed,c in [(1,ACC),(2,RED),(3,GREEN),(4,"#888")]:
        r=np.random.default_rng(seed); W=np.concatenate([[0],np.cumsum(r.normal(0,np.sqrt(t[1]),499))])
        ax.plot(t,W,color=c,lw=1.3,alpha=.9)
    ax.axhline(0,color=INK,lw=.8)
    ax.set_xlabel(r"$t$"); ax.set_ylabel(r"$W_t$"); ax.set_title(r"Brownian motion: continuous, nowhere differentiable",fontsize=12)
    save(fig,"stoch-04-brownian")

if __name__=="__main__":
    for fn in [f_distributions,f_bivariate_normal,f_clt,f_sampling_dists,f_confidence,
               f_hypothesis,f_regression,f_poisson_process,f_markov_converge,f_brownian]:
        try: fn()
        except Exception as e: print("✗",fn.__name__,"→",repr(e))
