import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import *

def f_least_action():
    t=np.linspace(0,1,200); x_true=t; 
    fig,ax=plt.subplots(figsize=(6.2,3.8))
    ax.plot(t,x_true,color=ACC,lw=2.4,label="actual path (extremal $S$)")
    for a,c in [(0.5,GRID),(-0.4,GRID),(0.25,"#bbb")]:
        ax.plot(t,x_true+a*np.sin(np.pi*t),color=c,lw=1.2,ls="--")
    ax.plot(t,x_true+0.5*np.sin(np.pi*t),color=GRID,lw=1.2,ls="--",label="varied paths")
    ax.plot([0,1],[0,1],"o",color=INK,ms=6)
    ax.set_xlabel(r"$t$"); ax.set_ylabel(r"$q(t)$"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Least action: $\delta S=0$ picks the true path",fontsize=12)
    save(fig,"mech-02-least-action")

def f_pendulum_phase():
    th=np.linspace(-2*np.pi,2*np.pi,400); w=np.linspace(-3,3,400); TH,W=np.meshgrid(th,w)
    fig,ax=plt.subplots(figsize=(6.8,3.8))
    ax.streamplot(TH,W,W,-np.sin(TH),color=ACC,density=1.1,linewidth=.7,arrowsize=.8)
    E_sep=1.0  # separatrix energy
    ax.contour(TH,W,0.5*W**2-np.cos(TH),levels=[1.0],colors=RED,linewidths=1.8)
    ax.set_xlabel(r"$\theta$"); ax.set_ylabel(r"$\dot{\theta}$")
    ax.set_title(r"Pendulum phase space: libration, separatrix (red), rotation",fontsize=12)
    save(fig,"mech-03-pendulum-phase")

def f_resonance():
    w=np.linspace(0,2.5,400); w0=1.0
    fig,ax=plt.subplots(figsize=(6.6,3.8))
    for z,c in [(0.05,ACC),(0.15,RED),(0.4,GREEN)]:
        A=1/np.sqrt((w0**2-w**2)**2+(2*z*w0*w)**2)
        ax.plot(w,A,color=c,lw=2,label=fr"$\zeta={z}$")
    ax.axvline(1,color=GRID,lw=1,ls=":")
    ax.set_xlabel(r"$\omega/\omega_0$"); ax.set_ylabel("amplitude")
    ax.legend(frameon=False,fontsize=10); ax.set_ylim(0,11)
    ax.set_title(r"Driven oscillator resonance: peak near $\omega_0$, sharpens as $\zeta\to0$",fontsize=12)
    save(fig,"mech-04-resonance")

def f_field_lines():
    fig,ax=plt.subplots(figsize=(6.0,4.4))
    x=np.linspace(-3,3,400); X,Y=np.meshgrid(x,x)
    def field(q,x0,y0):
        r2=(X-x0)**2+(Y-y0)**2+1e-9; return q*(X-x0)/r2**1.5, q*(Y-y0)/r2**1.5
    Ex1,Ey1=field(1,-1,0); Ex2,Ey2=field(-1,1,0)
    ax.streamplot(X,Y,Ex1+Ex2,Ey1+Ey2,color=ACC,density=1.3,linewidth=.7,arrowsize=.8)
    ax.plot(-1,0,"o",color=RED,ms=12); ax.text(-1,0,"+",color="white",ha="center",va="center",fontsize=12,fontweight="bold")
    ax.plot(1,0,"o",color=INK,ms=12); ax.text(1,0,"−",color="white",ha="center",va="center",fontsize=12)
    ax.set_aspect("equal"); ax.set_xlim(-3,3); ax.set_ylim(-3,3); ax.set_xticks([]); ax.set_yticks([])
    ax.set_title(r"Electric dipole field lines",fontsize=12)
    save(fig,"em-01-field-lines")

def f_em_wave():
    from mpl_toolkits.mplot3d import Axes3D  # noqa
    fig=plt.figure(figsize=(7.0,3.6)); ax=fig.add_subplot(111,projection="3d")
    z=np.linspace(0,4*np.pi,200)
    ax.plot(z,np.sin(z),np.zeros_like(z),color=ACC,lw=2,label=r"$\mathbf{E}$")
    ax.plot(z,np.zeros_like(z),np.sin(z),color=RED,lw=2,label=r"$\mathbf{B}$")
    for i in range(0,200,12):
        ax.plot([z[i],z[i]],[0,np.sin(z[i])],[0,0],color=ACC,lw=.6,alpha=.5)
        ax.plot([z[i],z[i]],[0,0],[0,np.sin(z[i])],color=RED,lw=.6,alpha=.5)
    ax.set_xlabel(r"propagation $z$"); ax.set_ylabel(r"$E$"); ax.set_zlabel(r"$B$")
    ax.legend(frameon=False,fontsize=11); ax.set_title(r"EM wave: $\mathbf{E}\perp\mathbf{B}\perp$ propagation",fontsize=12)
    ax.view_init(20,-70); save(fig,"em-02-em-wave")

def f_dipole_radiation():
    th=np.linspace(0,2*np.pi,400); r=np.sin(th)**2
    fig,ax=plt.subplots(figsize=(4.6,4.4),subplot_kw={"projection":"polar"})
    ax.plot(th,r,color=ACC,lw=2.2); ax.fill(th,r,color=ACC,alpha=.2)
    ax.set_title(r"Dipole radiation $\propto\sin^2\theta$ (none along axis)",fontsize=11,pad=14)
    ax.set_yticklabels([])
    save(fig,"em-03-dipole-radiation")

def f_spacetime():
    fig,ax=plt.subplots(figsize=(5.4,5.0))
    x=np.linspace(-2.5,2.5,10)
    ax.fill_between(x,np.abs(x),2.6,color=ACC2,alpha=.2)
    ax.plot(x,x,color=RED,lw=1.5); ax.plot(x,-x,color=RED,lw=1.5)
    ax.text(2.0,2.2,"light cone",color=RED,fontsize=10)
    b=0.5  # boost
    ax.plot(x,b*x,color=ACC,lw=1.8); ax.text(2.1,b*2.1,r"$x'$",color=ACC,fontsize=12)
    ax.plot(b*x,x,color=ACC,lw=1.8); ax.text(b*2.1+.05,2.2,r"$ct'$",color=ACC,fontsize=12)
    ax.axhline(0,color=INK,lw=.8); ax.axvline(0,color=INK,lw=.8)
    ax.text(2.4,-.25,r"$x$",fontsize=12); ax.text(.1,2.4,r"$ct$",fontsize=12)
    ax.set_xlim(-2.5,2.7); ax.set_ylim(-2.5,2.7); ax.set_aspect("equal"); ax.set_xticks([]); ax.set_yticks([])
    ax.set_title(r"Minkowski diagram: boosted frame tilts axes",fontsize=12)
    save(fig,"sr-01-spacetime")

def f_double_slit():
    x=np.linspace(-3,3,600)
    fig,ax=plt.subplots(figsize=(6.8,3.6))
    I=(np.cos(6*x))**2*(np.sinc(1.2*x))**2
    ax.plot(x,I,color=ACC,lw=2); ax.fill_between(x,I,color=ACC,alpha=.2)
    ax.set_xlabel(r"screen position"); ax.set_ylabel("intensity")
    ax.set_title(r"Double-slit: interference fringes under diffraction envelope",fontsize=12)
    save(fig,"opt-01-double-slit")

def f_carnot():
    # nR=1, constant gamma: both adiabats must meet both isotherms.
    gamma, Th, Tc = 5/3, 2.5, 1.5
    Va, Vb = 1.0, 1.6
    scale = (Th/Tc)**(1/(gamma-1))
    Vc, Vd = Vb*scale, Va*scale
    segments = [
        (np.linspace(Va,Vb,100), lambda v: Th/v, RED),
        (np.linspace(Vb,Vc,100), lambda v: Th/Vb*(Vb/v)**gamma, "#315f9d"),
        (np.linspace(Vc,Vd,100), lambda v: Tc/v, GREEN),
        (np.linspace(Vd,Va,100), lambda v: Tc/Vd*(Vd/v)**gamma, "#315f9d"),
    ]
    fig, ax = plt.subplots(figsize=(6.8,4.5))
    all_v, all_p = [], []
    for v, law, color in segments:
        pressure = law(v)
        ax.plot(v,pressure,color=color,lw=2)
        ax.annotate('',xy=(v[57],pressure[57]),xytext=(v[47],pressure[47]),
                    arrowprops=dict(arrowstyle='->',color=color,lw=2))
        all_v.extend(v); all_p.extend(pressure)
    ax.fill(all_v,all_p,color=ACC,alpha=.12)
    for label, v, p in [('A',Va,Th/Va),('B',Vb,Th/Vb),('C',Vc,Tc/Vc),('D',Vd,Tc/Vd)]:
        ax.plot(v,p,'o',color=INK,ms=4); ax.annotate(label,(v,p),xytext=(6,7),textcoords='offset points')
    ax.text(1.04,2.72,r'$T_h=2.5$; $T_c=1.5$; $\gamma=5/3$',fontsize=12)
    ax.text(1.95,2.4,'A→B: isothermal heat input',fontsize=10)
    ax.text(1.95,2.15,'B→C, D→A: adiabatic',fontsize=10,color='#315f9d')
    ax.text(1.95,.25,'C→D: isothermal heat output',fontsize=10)
    ax.set(xlabel=r'$V$ (normalized)',ylabel=r'$p$ (normalized)',xlim=(.8,Vc+.3),ylim=(0,3))
    ax.set_title('Carnot cycle: closed reversible loop; efficiency = 40%',fontsize=12)
    save(fig,'sm-01-carnot',reproducible=True)

def f_quantum_stats():
    E=np.linspace(-2,4,400)
    fig,ax=plt.subplots(figsize=(6.6,3.8))
    ax.plot(E,1/(np.exp(E)+1),color=ACC,lw=2,label="Fermi–Dirac")
    ax.plot(E,np.where(E>0.05,1/(np.exp(E)-1),np.nan),color=RED,lw=2,label="Bose–Einstein")
    ax.plot(E,np.exp(-E),color=GREEN,lw=2,ls="--",label="Maxwell–Boltzmann")
    ax.axvline(0,color=GRID,lw=1,ls=":"); ax.set_ylim(0,2.2)
    ax.set_xlabel(r"$(E-\mu)/kT$"); ax.set_ylabel(r"$\langle n\rangle$"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Quantum statistics: occupation of a state",fontsize=12)
    save(fig,"sm-03-quantum-stats")

if __name__=="__main__":
    for fn in [f_least_action,f_pendulum_phase,f_resonance,f_field_lines,f_em_wave,
               f_dipole_radiation,f_spacetime,f_double_slit,f_carnot,f_quantum_stats]:
        try: fn()
        except Exception as e: print("✗",fn.__name__,"→",repr(e))
