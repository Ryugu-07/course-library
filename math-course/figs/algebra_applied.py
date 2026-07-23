import sys; sys.path.insert(0,"/Users/karasuakamatsu/math-course/figs")
from _common import *
from mpl_toolkits.mplot3d import Axes3D  # noqa

def f_eigenvectors():
    A=np.array([[2.0,0.8],[0.8,1.4]])
    th=np.linspace(0,2*np.pi,100); circ=np.array([np.cos(th),np.sin(th)]); ell=A@circ
    w,v=np.linalg.eigh(A)
    fig,ax=plt.subplots(figsize=(5.4,5.0))
    ax.plot(circ[0],circ[1],color=GRID,lw=1.5,label="unit circle")
    ax.plot(ell[0],ell[1],color=ACC,lw=2,label=r"image $A\mathbf{x}$")
    for i,c in zip(range(2),[RED,GREEN]):
        d=v[:,i]*w[i]; ax.annotate("",xy=d,xytext=(0,0),arrowprops=dict(arrowstyle="-|>",color=c,lw=2.2))
        ax.annotate("",xy=-d,xytext=(0,0),arrowprops=dict(arrowstyle="-|>",color=c,lw=2.2))
        ax.text(d[0]*1.08,d[1]*1.08,fr"$\lambda_{i+1}={w[i]:.1f}$",color=c,fontsize=11)
    ax.set_aspect("equal"); ax.set_xlim(-3,3); ax.set_ylim(-3,3); ax.legend(frameon=False,fontsize=10,loc="upper left")
    ax.set_title(r"Eigenvectors: directions $A$ only scales, not rotates",fontsize=12)
    save(fig,"algebra-05-eigenvectors")

def f_quadratic_forms():
    x=np.linspace(-3,3,300); X,Y=np.meshgrid(x,x)
    fig,axes=plt.subplots(1,3,figsize=(9.6,3.4))
    forms=[("Positive definite\n(ellipse)",X**2+2*Y**2,ACC),
           ("Indefinite\n(hyperbola, saddle)",X**2-Y**2,RED),
           ("Positive semidefinite\n(degenerate)",(X-Y)**2,GREEN)]
    for ax,(t,Z,c) in zip(axes,forms):
        ax.contour(X,Y,Z,levels=[0.3,1,2,4],colors=c,linewidths=1.3)
        ax.set_aspect("equal"); ax.set_title(t,fontsize=11); ax.set_xticks([]); ax.set_yticks([])
    fig.suptitle(r"Level sets of quadratic form $\mathbf{x}^\top A\mathbf{x}$ by definiteness of $A$",fontsize=12,y=1.04)
    save(fig,"algebra-06-quadratic-forms")

def f_quadrics():
    fig=plt.figure(figsize=(9.6,3.6))
    u=np.linspace(0,2*np.pi,40); v=np.linspace(0,np.pi,20)
    ax=fig.add_subplot(131,projection="3d")
    X=2*np.outer(np.cos(u),np.sin(v)); Y=np.outer(np.sin(u),np.sin(v)); Z=1.4*np.outer(np.ones_like(u),np.cos(v))
    ax.plot_surface(X,Y,Z,cmap="Blues",alpha=.85,linewidth=0); ax.set_title("Ellipsoid",fontsize=11); ax.set_axis_off()
    ax=fig.add_subplot(132,projection="3d")
    vv=np.linspace(-1.3,1.3,20); U,V=np.meshgrid(u,vv)
    ax.plot_surface(np.cosh(V)*np.cos(U),np.cosh(V)*np.sin(U),1.3*np.sinh(V),cmap="Blues",alpha=.85,linewidth=0)
    ax.set_title("Hyperboloid (1 sheet)",fontsize=11); ax.set_axis_off()
    ax=fig.add_subplot(133,projection="3d")
    xx=np.linspace(-1.6,1.6,30); Xp,Yp=np.meshgrid(xx,xx)
    ax.plot_surface(Xp,Yp,Xp**2-Yp**2,cmap="Blues",alpha=.85,linewidth=0)
    ax.set_title("Saddle (hyperbolic paraboloid)",fontsize=11); ax.set_axis_off()
    save(fig,"geo-02-quadrics")

def f_curvature():
    t=np.linspace(0,2*np.pi,400); a,b=2,1; x=a*np.cos(t); y=b*np.sin(t)
    fig,ax=plt.subplots(figsize=(6.0,3.6)); ax.plot(x,y,color=INK,lw=2)
    for t0,c in [(0,RED),(np.pi/2,GREEN)]:
        xp,yp=-a*np.sin(t0),b*np.cos(t0); xpp,ypp=-a*np.cos(t0),-b*np.sin(t0)
        k=abs(xp*ypp-yp*xpp)/(xp**2+yp**2)**1.5; R=1/k
        nx,ny=-yp,xp; nl=np.hypot(nx,ny); nx,ny=nx/nl,ny/nl
        px,py=a*np.cos(t0),b*np.sin(t0); cx,cy=px+R*nx,py+R*ny
        circ=np.linspace(0,2*np.pi,80)
        ax.plot(cx+R*np.cos(circ),cy+R*np.sin(circ),color=c,lw=1.3,ls="--",label=fr"$R=1/\kappa={R:.2f}$")
        ax.plot([px],[py],"o",color=c,ms=6)
    ax.set_aspect("equal"); ax.legend(frameon=False,fontsize=10); ax.set_xlim(-3,4.5)
    ax.set_title(r"Osculating circle: radius $=1/\kappa$ (curvature)",fontsize=12)
    save(fig,"dg-01-curvature")

def f_gaussian_curvature():
    fig=plt.figure(figsize=(8.0,3.6))
    u=np.linspace(0,2*np.pi,40); v=np.linspace(0,np.pi,20)
    ax=fig.add_subplot(121,projection="3d")
    ax.plot_surface(np.outer(np.cos(u),np.sin(v)),np.outer(np.sin(u),np.sin(v)),np.outer(np.ones_like(u),np.cos(v)),cmap="Reds",alpha=.85,linewidth=0)
    ax.set_title(r"Sphere: $K>0$",fontsize=12); ax.set_axis_off()
    ax=fig.add_subplot(122,projection="3d")
    xx=np.linspace(-1.5,1.5,30); X,Y=np.meshgrid(xx,xx)
    ax.plot_surface(X,Y,X**2-Y**2,cmap="Blues",alpha=.85,linewidth=0)
    ax.set_title(r"Saddle: $K<0$",fontsize=12); ax.set_axis_off()
    save(fig,"dg-02-gaussian-curvature")

def f_runge():
    f=lambda x:1/(1+25*x**2); xx=np.linspace(-1,1,400)
    fig,ax=plt.subplots(figsize=(6.6,3.8)); ax.plot(xx,f(xx),color=INK,lw=2,label=r"$f(x)=\frac{1}{1+25x^2}$")
    for n,c in [(6,GREEN),(12,RED)]:
        xn=np.linspace(-1,1,n+1); coef=np.polyfit(xn,f(xn),n)
        ax.plot(xx,np.polyval(coef,xx),color=c,lw=1.5,ls="--",label=fr"degree {n} interpolant")
        ax.plot(xn,f(xn),"o",color=c,ms=4)
    ax.set_ylim(-0.5,1.4); ax.legend(frameon=False,fontsize=10); ax.set_xlabel(r"$x$")
    ax.set_title(r"Runge phenomenon: high-degree fit oscillates at edges",fontsize=12)
    save(fig,"num-03-runge")

def f_newton():
    f=lambda x:x**3-2*x-2; fp=lambda x:3*x**2-2
    xx=np.linspace(0,2.5,300); fig,ax=plt.subplots(figsize=(6.4,3.8))
    ax.plot(xx,f(xx),color=INK,lw=2); ax.axhline(0,color=GRID,lw=.8)
    x0=2.4
    for i in range(4):
        ax.plot([x0,x0],[0,f(x0)],color=ACC,lw=.8,ls=":")
        x1=x0-f(x0)/fp(x0)
        ax.plot([x0,x1],[f(x0),0],color=RED,lw=1.3)
        ax.plot([x0],[f(x0)],"o",color=ACC,ms=5); x0=x1
    ax.plot([x0],[0],"*",color=GREEN,ms=13)
    ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$f(x)$")
    ax.set_title(r"Newton's method: tangent line hits axis $\to$ next guess",fontsize=12)
    save(fig,"num-04-newton")

def f_convex():
    x=np.linspace(-2,2,300); f=lambda t:t**2+0.4
    fig,ax=plt.subplots(figsize=(6.2,3.8)); ax.plot(x,f(x),color=INK,lw=2,label=r"convex $f$")
    a,b=-1.3,1.6; ax.plot([a,b],[f(a),f(b)],color=RED,lw=1.6,ls="--",label="chord above graph")
    t0=0.5; ax.plot(x,f(t0)+2*t0*(x-t0),color=ACC,lw=1.6,label="tangent below graph")
    ax.plot([a,b],[f(a),f(b)],"o",color=RED,ms=5)
    ax.set_ylim(0,5); ax.legend(frameon=False,fontsize=10); ax.set_xlabel(r"$x$")
    ax.set_title(r"Convexity: graph below chords, above tangents",fontsize=12)
    save(fig,"opt-01-convex")

def f_gradient_descent():
    x=np.linspace(-2,3,300); X,Y=np.meshgrid(x,np.linspace(-2,3,300))
    f=lambda x,y:(x-1)**2+5*(y-0.6)**2
    fig,ax=plt.subplots(figsize=(6.2,4.4)); ax.contour(X,Y,f(X,Y),levels=15,cmap="Blues",linewidths=.7)
    p=np.array([-1.4,2.5]); lr=0.08; pts=[p.copy()]
    for _ in range(30):
        g=np.array([2*(p[0]-1),10*(p[1]-0.6)]); p=p-lr*g; pts.append(p.copy())
    pts=np.array(pts); ax.plot(pts[:,0],pts[:,1],"o-",color=RED,ms=3,lw=1.2)
    ax.plot([1],[0.6],"*",color=GREEN,ms=15)
    ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$y$")
    ax.set_title(r"Gradient descent: step against $\nabla f$ toward the min",fontsize=12)
    save(fig,"opt-02-gradient-descent")

def f_lp():
    fig,ax=plt.subplots(figsize=(5.8,4.4))
    # feasible region: x>=0,y>=0, x+2y<=8, 3x+2y<=12
    import numpy as _np
    verts=_np.array([[0,0],[4,0],[2,3],[0,4]])
    ax.fill(verts[:,0],verts[:,1],color=ACC2,alpha=.4)
    ax.plot(_np.append(verts[:,0],verts[0,0]),_np.append(verts[:,1],verts[0,1]),color=ACC,lw=1.8)
    x=_np.linspace(0,5,10)
    for c in [4,7,10]:
        ax.plot(x,(c-1.2*x)/1.0,color=RED,lw=.9,ls="--")
    ax.plot([2],[3],"*",color=GREEN,ms=16); ax.text(2.1,3.15,"optimum vertex",fontsize=10,color=GREEN)
    ax.set_xlim(0,5); ax.set_ylim(0,5); ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$y$")
    ax.set_title(r"LP: optimum sits at a vertex of the feasible polygon",fontsize=12)
    save(fig,"opt-04-lp")

if __name__=="__main__":
    for fn in [f_eigenvectors,f_quadratic_forms,f_quadrics,f_curvature,f_gaussian_curvature,
               f_runge,f_newton,f_convex,f_gradient_descent,f_lp]:
        try: fn()
        except Exception as e: print("✗",fn.__name__,"→",repr(e))
