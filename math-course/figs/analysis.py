# 分析线 plot 图（图内一律英文/数学符号；中文解释放讲义 figcaption）
import sys; sys.path.insert(0, "/Users/karasuakamatsu/math-course/figs")
from _common import *

def _odeint(f, y0, xs):
    ys=[y0]
    for i in range(1,len(xs)):
        h=xs[i]-xs[i-1]; y=ys[-1]
        k1=f(y,xs[i-1]); k2=f(y+h*k1,xs[i]); ys.append(y+h*(k1+k2)/2)
    return np.array(ys)

def f_epsilon_limit():
    n=np.arange(1,41); a=2+np.sin(n)/n**0.9+0.6/n; L=2.0; eps=0.25
    fig,ax=plt.subplots(figsize=(6.8,3.8))
    ax.axhspan(L-eps,L+eps,color=ACC2,alpha=.25); ax.axhline(L,color=ACC,lw=1.4,ls="--")
    ax.plot(n,a,"o",color=INK,ms=4); ax.axvline(12,color=RED,lw=1,ls=":")
    ax.text(12.5,2.72,r"$N$",color=RED); ax.text(41,L,r"$L$",color=ACC,va="center")
    ax.text(41,L+eps,r"$L+\epsilon$",color=ACC,va="center",fontsize=11)
    ax.text(41,L-eps,r"$L-\epsilon$",color=ACC,va="center",fontsize=11)
    ax.set_xlim(0,46); ax.set_ylim(1.4,3.0); ax.set_xlabel(r"$n$"); ax.set_ylabel(r"$a_n$")
    ax.set_title(r"$\forall\,\epsilon>0,\ \exists\,N:\ n>N \Rightarrow |a_n-L|<\epsilon$",fontsize=12)
    save(fig,"analysis-01-epsilon-limit")

def f_derivative_tangent():
    x=np.linspace(0,3,400); f=lambda t:0.5*t**2-t+1.5; a=2.0; h=0.9
    fig,ax=plt.subplots(figsize=(6.4,4.0))
    ax.plot(x,f(x),color=INK,lw=2.2,label=r"$f(x)$")
    fp=a-1; tx=np.linspace(0.7,3,50)
    ax.plot(tx,f(a)+fp*(tx-a),color=ACC,lw=1.8,label=r"tangent, slope $f'(a)$")
    sx=np.linspace(0.7,3,50); sl=(f(a+h)-f(a))/h
    ax.plot(sx,f(a)+sl*(sx-a),color=RED,lw=1.5,ls="--",label=r"secant, slope $\frac{f(a+h)-f(a)}{h}$")
    ax.plot([a],[f(a)],"o",color=ACC,ms=6); ax.plot([a+h],[f(a+h)],"o",color=RED,ms=6)
    ax.text(a,-.15,r"$a$",ha="center",color=ACC); ax.text(a+h,-.15,r"$a+h$",ha="center",color=RED)
    ax.set_ylim(0,4); ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$y$")
    ax.legend(loc="upper left",frameon=False,fontsize=10)
    ax.set_title(r"secant $\to$ tangent as $h\to 0$",fontsize=12)
    save(fig,"analysis-02-derivative-tangent")

def f_mvt():
    x=np.linspace(0.3,4,400); f=lambda t:np.sin(t)+0.3*t+1; a,b=0.6,3.6
    fig,ax=plt.subplots(figsize=(6.4,3.8)); ax.plot(x,f(x),color=INK,lw=2.2)
    sl=(f(b)-f(a))/(b-a); ax.plot([a,b],[f(a),f(b)],color=RED,lw=1.6,ls="--",label=r"secant $a\to b$")
    c=np.arccos(sl-0.3); cx=np.linspace(c-1,c+1,30)
    ax.plot(cx,f(c)+sl*(cx-c),color=ACC,lw=1.8,label=r"tangent at $c$ (parallel)")
    for px,c0,lab in [(a,RED,"a"),(b,RED,"b"),(c,ACC,"c")]:
        ax.plot([px],[f(px)],"o",color=c0,ms=6); ax.text(px,f(px)+.18,f"${lab}$",ha="center",color=c0)
    ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$y$"); ax.legend(loc="lower right",frameon=False,fontsize=10)
    ax.set_title(r"MVT: $\exists\,c\in(a,b),\ f'(c)=\frac{f(b)-f(a)}{b-a}$",fontsize=12)
    save(fig,"analysis-02-mvt")

def f_riemann_sum():
    x=np.linspace(0,3,400); f=lambda t:0.4*t**2+0.5
    fig,axes=plt.subplots(1,2,figsize=(8.4,3.6),sharey=True)
    for ax,nr,ti in [(axes[0],6,"6 rectangles"),(axes[1],16,"16 rectangles")]:
        ax.plot(x,f(x),color=INK,lw=2); ed=np.linspace(0,3,nr+1); w=ed[1]-ed[0]
        ax.bar(ed[:-1],f(ed[:-1]),width=w,align="edge",color=ACC2,edgecolor=ACC,alpha=.55,lw=.8)
        ax.set_title(ti,fontsize=12); ax.set_xlabel(r"$x$")
    axes[0].set_ylabel(r"$f(x)$")
    fig.suptitle(r"Riemann sum $\to\int_a^b f\,dx$",fontsize=12,y=1.02)
    save(fig,"analysis-03-riemann-sum")

def f_series_partial():
    N=20; n=np.arange(1,N+1); geom=np.cumsum(0.5**n); alt=np.cumsum((-1)**(n+1)/n)
    fig,ax=plt.subplots(figsize=(6.8,3.8))
    ax.plot(n,geom,"o-",color=ACC,ms=4,label=r"$\sum 2^{-n}\to 1$")
    ax.plot(n,alt,"s-",color=RED,ms=4,label=r"$\sum \frac{(-1)^{n+1}}{n}\to\ln 2$")
    ax.axhline(1,color=ACC,lw=1,ls="--"); ax.axhline(np.log(2),color=RED,lw=1,ls="--")
    ax.set_xlabel(r"$N$ (terms)"); ax.set_ylabel(r"partial sum $S_N$")
    ax.legend(loc="center right",frameon=False,fontsize=11)
    ax.set_title(r"Partial sums converge to the series limit",fontsize=12)
    save(fig,"analysis-04-series-partial")

def f_surface_tangent():
    from mpl_toolkits.mplot3d import Axes3D  # noqa
    fig=plt.figure(figsize=(6.4,4.6)); ax=fig.add_subplot(111,projection="3d")
    X,Y=np.meshgrid(np.linspace(-2,2,50),np.linspace(-2,2,50)); Z=np.exp(-(X**2+Y**2)/3)
    ax.plot_surface(X,Y,Z,cmap="Blues",alpha=.85,linewidth=0)
    a,b=0.8,-0.6; f=lambda x,y:np.exp(-(x**2+y**2)/3); fa=f(a,b); fx=-2*a/3*fa; fy=-2*b/3*fa
    tp=0.7; Xx,Yy=np.meshgrid(np.linspace(a-tp,a+tp,6),np.linspace(b-tp,b+tp,6))
    ax.plot_surface(Xx,Yy,fa+fx*(Xx-a)+fy*(Yy-b),color=RED,alpha=.35,linewidth=0)
    ax.scatter([a],[b],[fa],color=RED,s=30)
    ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$y$"); ax.set_zlabel(r"$z$")
    ax.set_title(r"Tangent plane: $z=f(a,b)+f_x(x-a)+f_y(y-b)$",fontsize=12); ax.view_init(28,-55)
    save(fig,"analysis-05-surface-tangent")

def f_gradient_field():
    x=np.linspace(-2,2,300); X,Y=np.meshgrid(x,x); Z=X**2+0.6*Y**2
    fig,ax=plt.subplots(figsize=(5.6,4.6)); ax.contour(X,Y,Z,levels=8,colors=INK,linewidths=.8)
    xs=np.linspace(-1.6,1.6,7); Xg,Yg=np.meshgrid(xs,xs)
    ax.quiver(Xg,Yg,2*Xg,1.2*Yg,color=ACC,alpha=.85,width=.005)
    ax.set_aspect("equal"); ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$y$")
    ax.set_title(r"$\nabla f \perp$ level sets, points uphill",fontsize=12)
    save(fig,"analysis-05-gradient-field")

def f_slope_field():
    x=np.linspace(-3,3,22); X,Y=np.meshgrid(x,x); S=Y-X; L=np.hypot(1,S)
    fig,ax=plt.subplots(figsize=(6.0,4.6))
    ax.quiver(X,Y,1/L,S/L,color=GRID,width=.003,headwidth=0,headlength=0,scale=32)
    for y0,c in [(-2.0,ACC),(-0.5,RED),(1.5,GREEN)]:
        xs=np.linspace(-3,3,400); ax.plot(xs,_odeint(lambda yy,xx:yy-xx,y0,xs),color=c,lw=2)
    ax.set_xlim(-3,3); ax.set_ylim(-3,3); ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$y$")
    ax.set_title(r"$y'=y-x$: slope field + solution curves",fontsize=12)
    save(fig,"ode-01-slope-field")

def f_damping():
    t=np.linspace(0,12,600); fig,ax=plt.subplots(figsize=(6.8,3.8))
    ax.plot(t,np.exp(-0.25*t)*np.cos(2*t),color=ACC,lw=2,label="underdamped")
    ax.plot(t,(1+1.5*t)*np.exp(-1.4*t),color=RED,lw=2,label="critical")
    ax.plot(t,1.2*np.exp(-0.5*t)-0.2*np.exp(-2.2*t),color=GREEN,lw=2,label="overdamped")
    ax.axhline(0,color=GRID,lw=.8); ax.set_xlabel(r"$t$"); ax.set_ylabel(r"$x(t)$")
    ax.legend(loc="upper right",frameon=False,fontsize=10)
    ax.set_title(r"$x''+2\zeta\omega x'+\omega^2 x=0$: three damping regimes",fontsize=12)
    save(fig,"ode-02-damping")

def f_phase_portraits():
    fig,axes=plt.subplots(2,2,figsize=(7.4,7.0))
    mats={"saddle":[[1,0],[0,-1]],"stable spiral":[[-0.4,-1],[1,-0.4]],
          "stable node":[[-1,0],[0,-2]],"center":[[0,-1],[1,0]]}
    xs=np.linspace(-2,2,20); X,Y=np.meshgrid(xs,xs)
    for ax,(name,A) in zip(axes.flat,mats.items()):
        A=np.array(A); U=A[0,0]*X+A[0,1]*Y; V=A[1,0]*X+A[1,1]*Y
        ax.streamplot(X,Y,U,V,color=ACC,density=1.0,linewidth=.8,arrowsize=.8)
        ax.plot([0],[0],"o",color=RED,ms=6); ax.set_title(name,fontsize=11)
        ax.set_xticks([]); ax.set_yticks([]); ax.set_aspect("equal")
    fig.suptitle(r"$\dot{\mathbf{x}}=A\mathbf{x}$: phase portraits by eigenvalues of $A$",fontsize=12)
    save(fig,"ode-03-phase-portrait")

def f_riemann_lebesgue():
    x=np.linspace(0,4,400); f=lambda t:1.2+np.sin(t)+0.15*t
    fig,axes=plt.subplots(1,2,figsize=(8.6,3.8),sharey=True)
    ax=axes[0]; ax.plot(x,f(x),color=INK,lw=2); ed=np.linspace(0,4,9)
    ax.bar(ed[:-1],f(ed[:-1]),width=.5,align="edge",color=ACC2,edgecolor=ACC,alpha=.5)
    ax.set_title("Riemann: slice the domain",fontsize=12); ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$f$")
    ax=axes[1]; ax.plot(x,f(x),color=INK,lw=2)
    for lv in np.linspace(0.4,2.6,7): ax.axhline(lv,color=ACC,lw=.7,alpha=.7)
    ax.fill_between(x,1.2,1.6,where=(f(x)>=1.2)&(f(x)<1.6),color=RED,alpha=.3)
    ax.set_title("Lebesgue: slice the range",fontsize=12); ax.set_xlabel(r"$x$")
    fig.suptitle("Riemann (vertical) vs Lebesgue (horizontal) slicing",fontsize=12,y=1.03)
    save(fig,"real-02-riemann-vs-lebesgue")

def f_projection():
    fig,ax=plt.subplots(figsize=(5.6,4.4))
    v=np.array([2.4,2.0]); u=np.array([3,0.6]); uu=u/np.linalg.norm(u); p=(v@uu)*uu
    ax.annotate("",xy=v,xytext=(0,0),arrowprops=dict(arrowstyle="-|>",color=INK,lw=2))
    ax.annotate("",xy=u,xytext=(0,0),arrowprops=dict(arrowstyle="-|>",color=GRID,lw=1.5))
    ax.annotate("",xy=p,xytext=(0,0),arrowprops=dict(arrowstyle="-|>",color=ACC,lw=2))
    ax.plot([v[0],p[0]],[v[1],p[1]],color=RED,ls="--",lw=1.5)
    ax.text(v[0]+.05,v[1]+.1,r"$x$",color=INK); ax.text(p[0]+.05,p[1]-.3,r"$\hat{x}=\mathrm{proj}_M x$",color=ACC,fontsize=12)
    ax.text(2.85,.7,r"$M$",color="#888"); ax.text(1.35,1.4,r"$x-\hat{x}\perp M$",color=RED,fontsize=11)
    ax.set_xlim(-.3,3.4); ax.set_ylim(-.3,2.6); ax.set_aspect("equal"); ax.set_xticks([]); ax.set_yticks([])
    ax.set_title(r"Best approximation = orthogonal projection",fontsize=12)
    save(fig,"func-02-orthogonal-projection")

def f_heat_decay():
    x=np.linspace(0,np.pi,300); fig,ax=plt.subplots(figsize=(6.8,3.8))
    for t,al in zip([0,0.05,0.15,0.4,1.0],np.linspace(1,.35,5)):
        ax.plot(x,np.sin(x)*np.exp(-t)+0.5*np.sin(3*x)*np.exp(-9*t),color=ACC,alpha=al,lw=2,label=f"$t={t}$")
    ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$u(x,t)$"); ax.legend(frameon=False,fontsize=10,loc="upper right")
    ax.set_title(r"Heat eqn $u_t=u_{xx}$: high modes decay as $e^{-n^2 t}$",fontsize=12)
    save(fig,"pde-01-heat-decay")

def f_heat_kernel():
    x=np.linspace(-4,4,400); fig,ax=plt.subplots(figsize=(6.8,3.8))
    for t,al in zip([0.05,0.2,0.5,1.0,2.0],np.linspace(1,.4,5)):
        ax.plot(x,1/np.sqrt(4*np.pi*t)*np.exp(-x**2/(4*t)),color=ACC,alpha=al,lw=2,label=f"$t={t}$")
    ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$\Phi(x,t)$"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Heat kernel $\Phi=\frac{1}{\sqrt{4\pi t}}e^{-x^2/4t}$",fontsize=12)
    save(fig,"pde-02-heat-kernel")

if __name__=="__main__":
    for fn in [f_epsilon_limit,f_derivative_tangent,f_mvt,f_riemann_sum,f_series_partial,
               f_surface_tangent,f_gradient_field,f_slope_field,f_damping,f_phase_portraits,
               f_riemann_lebesgue,f_projection,f_heat_decay,f_heat_kernel]:
        try: fn()
        except Exception as e: print("✗",fn.__name__,"→",repr(e))
