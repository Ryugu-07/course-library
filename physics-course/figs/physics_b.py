import sys; sys.path.insert(0,"/Users/karasuakamatsu/physics-course/figs")
from _common import *
from numpy.polynomial import legendre
from scipy_free import *  # placeholder

def f_square_well():
    x=np.linspace(0,1,300); fig,ax=plt.subplots(figsize=(6.0,4.0))
    L=1
    for n,c in zip([1,2,3],[ACC,RED,GREEN]):
        E=n**2; psi=np.sqrt(2)*np.sin(n*np.pi*x)
        ax.plot(x,psi*1.2+E,color=c,lw=2); ax.axhline(E,color=c,lw=.8,ls=":")
        ax.text(1.02,E,fr"$n={n},\ E\propto{n**2}$",color=c,va="center",fontsize=10)
    ax.axvline(0,color=INK,lw=2); ax.axvline(1,color=INK,lw=2)
    ax.set_xlim(-0.05,1.5); ax.set_xlabel(r"$x/L$"); ax.set_ylabel(r"$E_n$ + $\psi_n$")
    ax.set_title(r"Infinite square well: quantized levels $E_n\propto n^2$",fontsize=12)
    save(fig,"qm-02-square-well")

def f_harmonic():
    x=np.linspace(-4,4,400); fig,ax=plt.subplots(figsize=(6.0,4.0))
    from numpy.polynomial.hermite import hermval
    ax.plot(x,0.5*x**2,color=INK,lw=1.5,ls="--")
    for n,c in zip([0,1,2,3],[ACC,RED,GREEN,"#c77"]):
        H=np.zeros(n+1); H[n]=1
        psi=hermval(x,H)*np.exp(-x**2/2)
        psi=psi/np.max(np.abs(psi))*0.6
        E=n+0.5
        ax.plot(x,psi+E,color=c,lw=1.8); ax.axhline(E,color=c,lw=.6,ls=":")
    ax.set_ylim(0,4.5); ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$E_n=\hbar\omega(n+\frac{1}{2})$")
    ax.set_title(r"Harmonic oscillator: evenly spaced levels in a parabola",fontsize=12)
    save(fig,"qm-02-harmonic")

def f_hydrogen_radial():
    r=np.linspace(0,25,400); fig,ax=plt.subplots(figsize=(6.6,3.8))
    R10=2*np.exp(-r); R20=(1-r/2)*np.exp(-r/2)/(2*np.sqrt(2)); R21=r*np.exp(-r/2)/(2*np.sqrt(6))
    for R,lab,c in [(R10,"1s",ACC),(R20,"2s",RED),(R21,"2p",GREEN)]:
        P=(r*R)**2; ax.plot(r,P/np.max(P),color=c,lw=2,label=lab)
    ax.set_xlabel(r"$r/a_0$"); ax.set_ylabel(r"radial prob. $r^2|R|^2$"); ax.legend(frameon=False,fontsize=11)
    ax.set_title(r"Hydrogen radial probability distributions",fontsize=12)
    save(fig,"qm-03-hydrogen-radial")

def f_phonon():
    k=np.linspace(-np.pi,np.pi,400); fig,ax=plt.subplots(figsize=(6.4,3.8))
    ac=2*np.abs(np.sin(k/2)); op=np.sqrt(3+np.cos(k))*1.4
    ax.plot(k,ac,color=ACC,lw=2,label="acoustic branch")
    ax.plot(k,op,color=RED,lw=2,label="optical branch")
    ax.set_xlabel(r"wavevector $k$"); ax.set_ylabel(r"$\omega(k)$"); ax.legend(frameon=False,fontsize=10)
    ax.set_xticks([-np.pi,0,np.pi]); ax.set_xticklabels([r"$-\pi/a$","0",r"$\pi/a$"])
    ax.set_title(r"Phonon dispersion (diatomic chain)",fontsize=12)
    save(fig,"solid-01-phonon")

def f_bands():
    k=np.linspace(-1,1,400); fig,ax=plt.subplots(figsize=(6.0,4.0))
    for n,off,gap in [(0,0,0),(1,2.2,0.6),(2,5,0.4)]:
        E=off+2*np.abs(k)+n
        ax.fill_between(k,off+1.0*k**2, off+1.0*k**2+0.9,color=ACC2,alpha=.5)
    ax.axhspan(1.9,2.2,color=RED,alpha=.25); ax.text(0.5,2.0,"band gap",color=RED,fontsize=10)
    ax.set_xlabel(r"$k$"); ax.set_ylabel(r"$E(k)$"); ax.set_xticks([-1,0,1]); ax.set_xticklabels([r"$-\pi/a$","0",r"$\pi/a$"])
    ax.set_title(r"Electronic band structure: allowed bands + forbidden gaps",fontsize=12)
    save(fig,"solid-02-bands")

def f_special_functions():
    x=np.linspace(0,15,400); fig,axes=plt.subplots(1,2,figsize=(8.6,3.4))
    from scipy_free import jn
    ax=axes[0]
    for n,c in [(0,ACC),(1,RED),(2,GREEN)]:
        ax.plot(x,jn(n,x),color=c,lw=1.8,label=fr"$J_{n}$")
    ax.axhline(0,color=GRID,lw=.6); ax.set_title("Bessel $J_n$",fontsize=12); ax.legend(frameon=False,fontsize=10); ax.set_xlabel(r"$x$")
    ax=axes[1]; xx=np.linspace(-1,1,300)
    for n,c in [(1,ACC),(2,RED),(3,GREEN),(4,"#c77")]:
        cc=np.zeros(n+1); cc[n]=1; ax.plot(xx,legendre.legval(xx,cc),color=c,lw=1.8,label=fr"$P_{n}$")
    ax.axhline(0,color=GRID,lw=.6); ax.set_title("Legendre $P_n$",fontsize=12); ax.legend(frameon=False,fontsize=9); ax.set_xlabel(r"$x$")
    save(fig,"mp-01-special-functions")

def f_landau():
    m=np.linspace(-1.5,1.5,300); fig,ax=plt.subplots(figsize=(6.2,3.8))
    for a,c,lab in [(1.0,RED,r"$T>T_c$ (single well)"),(0,GRID,r"$T=T_c$"),(-1.0,ACC,r"$T<T_c$ (double well)")]:
        F=a*m**2+m**4; ax.plot(m,F,color=c,lw=2,label=lab)
    ax.plot([-1/np.sqrt(2),1/np.sqrt(2)],[-0.25,-0.25],"o",color=ACC,ms=6)
    ax.set_xlabel(r"order parameter $m$"); ax.set_ylabel(r"free energy $F(m)$"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Landau theory: symmetry breaking as $T$ drops below $T_c$",fontsize=12)
    save(fig,"asm-01-landau")

def f_ising_mag():
    T=np.linspace(0,2,400); Tc=1.0; m=np.where(T<Tc,(1-(T/Tc)**2.2)**0.5,0)
    fig,ax=plt.subplots(figsize=(6.2,3.8))
    ax.plot(T,m,color=ACC,lw=2.4); ax.plot(T,-m,color=ACC,lw=2.4)
    ax.axvline(Tc,color=RED,lw=1.2,ls="--"); ax.text(Tc+.03,0.8,r"$T_c$",color=RED,fontsize=12)
    ax.fill_between(T,m,-m,color=ACC2,alpha=.2)
    ax.set_xlabel(r"temperature $T$"); ax.set_ylabel(r"magnetization $m$")
    ax.set_title(r"Spontaneous magnetization vanishes at the critical point",fontsize=12)
    save(fig,"asm-02-ising-mag")

def f_rg_flow():
    g=np.linspace(0,3,400); beta=g*(1-g)*(g-2)*0.5
    fig,ax=plt.subplots(figsize=(6.4,3.4))
    ax.plot(g,beta,color=ACC,lw=2); ax.axhline(0,color=INK,lw=.8)
    for fp,stab in [(0,"stable"),(1,"unstable"),(2,"stable")]:
        ax.plot([fp],[0],"o",color=(GREEN if stab=="stable" else RED),ms=9)
    for x0 in [0.3,0.7,1.3,1.7,2.5]:
        b=x0*(1-x0)*(x0-2)*0.5; ax.annotate("",xy=(x0+0.12*np.sign(b),0),xytext=(x0,0),
            arrowprops=dict(arrowstyle="-|>",color="#888",lw=1.3))
    ax.set_xlabel(r"coupling $g$"); ax.set_ylabel(r"$\beta(g)$")
    ax.set_title(r"RG flow: fixed points ($\beta{=}0$) govern critical behavior",fontsize=12)
    save(fig,"asm-03-rg-flow")

def f_bloch():
    from mpl_toolkits.mplot3d import Axes3D  # noqa
    fig=plt.figure(figsize=(4.8,4.8)); ax=fig.add_subplot(111,projection="3d")
    u=np.linspace(0,2*np.pi,40); v=np.linspace(0,np.pi,20)
    ax.plot_wireframe(np.outer(np.cos(u),np.sin(v)),np.outer(np.sin(u),np.sin(v)),
                      np.outer(np.ones_like(u),np.cos(v)),color=GRID,lw=.4)
    th,ph=0.9,0.7; vec=[np.sin(th)*np.cos(ph),np.sin(th)*np.sin(ph),np.cos(th)]
    ax.quiver(0,0,0,*vec,color=ACC,lw=2.5,arrow_length_ratio=.12)
    ax.text(0,0,1.25,r"$|0\rangle$",fontsize=12,ha="center"); ax.text(0,0,-1.4,r"$|1\rangle$",fontsize=12,ha="center")
    ax.text(vec[0],vec[1],vec[2]+.15,r"$|\psi\rangle$",color=ACC,fontsize=12)
    ax.set_axis_off(); ax.set_title(r"Bloch sphere: a qubit state",fontsize=12); ax.view_init(18,30)
    save(fig,"qi-01-bloch")

def f_scale_factor():
    t=np.linspace(0.01,2,300); fig,ax=plt.subplots(figsize=(6.4,3.8))
    ax.plot(t,t**0.5,color=RED,lw=2,label=r"radiation $a\propto t^{1/2}$")
    ax.plot(t,t**(2/3),color=ACC,lw=2,label=r"matter $a\propto t^{2/3}$")
    ax.plot(t,0.3*np.exp(1.6*t),color=GREEN,lw=2,label=r"dark energy $a\propto e^{Ht}$")
    ax.set_xlabel(r"time $t$"); ax.set_ylabel(r"scale factor $a(t)$"); ax.legend(frameon=False,fontsize=10); ax.set_ylim(0,3)
    ax.set_title(r"Cosmic expansion: which component dominates sets $a(t)$",fontsize=12)
    save(fig,"cosmo-01-scale-factor")

def f_eff_potential():
    r=np.linspace(2,30,400); L=4.0; 
    Veff=-1/r+L**2/(2*r**2)-L**2/(r**3)  # Schwarzschild-like (GM=1)
    Vnewton=-1/r+L**2/(2*r**2)
    fig,ax=plt.subplots(figsize=(6.4,3.8))
    ax.plot(r,Vnewton,color=GRID,lw=1.8,ls="--",label="Newtonian")
    ax.plot(r,Veff,color=ACC,lw=2,label="Schwarzschild (GR)")
    ax.axhline(0,color=INK,lw=.6); ax.set_ylim(-0.08,0.08)
    ax.set_xlabel(r"$r/GM$"); ax.set_ylabel(r"$V_{\rm eff}(r)$"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Schwarzschild effective potential: GR allows plunge orbits",fontsize=12)
    save(fig,"gr-02-effective-potential")

if __name__=="__main__":
    for fn in [f_square_well,f_harmonic,f_hydrogen_radial,f_phonon,f_bands,f_special_functions,
               f_landau,f_ising_mag,f_rg_flow,f_bloch,f_scale_factor,f_eff_potential]:
        try: fn()
        except Exception as e: print("✗",fn.__name__,"→",repr(e))
