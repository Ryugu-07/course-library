import sys; sys.path.insert(0,"/Users/karasuakamatsu/math-course/figs")
from _common import *
from mpl_toolkits.mplot3d import Axes3D  # noqa

def f_double_integral():
    fig=plt.figure(figsize=(6.2,4.4)); ax=fig.add_subplot(111,projection="3d")
    x=np.linspace(-1.5,1.5,40); X,Y=np.meshgrid(x,x); Z=2-0.5*(X**2+Y**2)
    ax.plot_surface(X,Y,Z,cmap="Blues",alpha=.55,linewidth=0)
    xs=np.linspace(-1.5,1.5,12); Xs,Ys=np.meshgrid(xs,xs)
    for xi,yi in zip(Xs.ravel(),Ys.ravel()):
        z=2-0.5*(xi**2+yi**2)
        ax.plot([xi,xi],[yi,yi],[0,z],color=ACC,alpha=.25,lw=.8)
    ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$y$"); ax.set_zlabel(r"$z$")
    ax.set_title(r"Double integral $\iint_D f\,dA$ = volume under the surface",fontsize=12)
    ax.view_init(24,-58); save(fig,"analysis-06-double-integral")

def f_contour_residue():
    fig,ax=plt.subplots(figsize=(5.4,4.8)); th=np.linspace(0,2*np.pi,200)
    ax.plot(2*np.cos(th),2*np.sin(th),color=ACC,lw=2)
    ax.annotate("",xy=(2*np.cos(0.3),2*np.sin(0.3)),xytext=(2*np.cos(0.1),2*np.sin(0.1)),
                arrowprops=dict(arrowstyle="-|>",color=ACC,lw=2))
    poles=[(0.8,0.6),(-1.0,-0.4),(0.2,-1.1)]
    for i,(px,py) in enumerate(poles):
        ax.plot([px],[py],"x",color=RED,ms=11,mew=2.5); ax.text(px+.1,py+.1,fr"$z_{i+1}$",color=RED,fontsize=12)
    ax.plot([3.2],[0],"x",color="#aaa",ms=10,mew=2); ax.text(2.7,.2,"outside",color="#999",fontsize=10)
    ax.set_aspect("equal"); ax.set_xlim(-3.5,3.8); ax.set_ylim(-3,3)
    ax.axhline(0,color=GRID,lw=.6); ax.axvline(0,color=GRID,lw=.6)
    ax.set_xlabel(r"$\mathrm{Re}\,z$"); ax.set_ylabel(r"$\mathrm{Im}\,z$")
    ax.set_title(r"Residue theorem: $\oint=2\pi i\sum$ residues inside",fontsize=12)
    save(fig,"complex-03-contour-residue")

def f_kl():
    x=np.linspace(-5,7,400); n=lambda x,m,s:np.exp(-(x-m)**2/(2*s**2))/(s*np.sqrt(2*np.pi))
    p=n(x,0,1); q=n(x,2,1.4)
    fig,ax=plt.subplots(figsize=(6.6,3.8))
    ax.plot(x,p,color=ACC,lw=2,label=r"$p$ (true)"); ax.plot(x,q,color=RED,lw=2,label=r"$q$ (model)")
    ax.fill_between(x,p,q,where=p>q,color=ACC,alpha=.18); ax.fill_between(x,p,q,where=q>p,color=RED,alpha=.15)
    ax.set_xlabel(r"$x$"); ax.set_ylabel("density"); ax.legend(frameon=False,fontsize=11)
    ax.set_title(r"KL $D(p\Vert q)=\int p\log\frac{p}{q}$: gap, and asymmetric",fontsize=12)
    save(fig,"info-02-kl")

def f_condition():
    fig,axes=plt.subplots(1,2,figsize=(8.6,3.8))
    x=np.linspace(-1,3,10)
    ax=axes[0]
    ax.plot(x,2-1.0*x,color=ACC,lw=2); ax.plot(x,0.5+1.0*x,color=RED,lw=2)
    ax.plot([0.75],[1.25],"o",color=GREEN,ms=8)
    ax.set_title("Well-conditioned: lines cross sharply",fontsize=11); ax.set_xticks([]); ax.set_yticks([]); ax.set_aspect("equal")
    ax=axes[1]
    ax.plot(x,1+1.0*x,color=ACC,lw=2); ax.plot(x,1.05+0.95*x,color=RED,lw=2)
    ax.fill_between(x,1+1.0*x,1.05+0.95*x,color="#ddd",alpha=.6)
    ax.set_title("Ill-conditioned: near-parallel, fuzzy solution",fontsize=11); ax.set_xticks([]); ax.set_yticks([]); ax.set_aspect("equal")
    fig.suptitle(r"Condition number: how much output wobbles when input nudges",fontsize=12,y=1.03)
    save(fig,"num-02-condition")

if __name__=="__main__":
    for fn in [f_double_integral,f_contour_residue,f_kl,f_condition]:
        try: fn()
        except Exception as e: print("✗",fn.__name__,"→",repr(e))
