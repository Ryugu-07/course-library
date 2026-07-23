import sys; sys.path.insert(0,"/Users/karasuakamatsu/comfy-course/figs")
from _common import *
rng=np.random.default_rng(4)

def f_distribution_sampling():
    n=400; t=rng.uniform(0,3*np.pi,n); x=t*np.cos(t)/3+rng.normal(0,0.15,n); y=t*np.sin(t)/3+rng.normal(0,0.15,n)
    fig,axes=plt.subplots(1,2,figsize=(8.0,3.8))
    axes[0].plot(x,y,".",color=INK,ms=3); axes[0].set_title("real data $\\sim p_{\\rm data}$",fontsize=12)
    t2=rng.uniform(0,3*np.pi,n); x2=t2*np.cos(t2)/3+rng.normal(0,0.22,n); y2=t2*np.sin(t2)/3+rng.normal(0,0.22,n)
    axes[1].plot(x2,y2,".",color=ACC,ms=3); axes[1].set_title(r"model samples $\sim p_\theta$",fontsize=12)
    for ax in axes: ax.set_xticks([]); ax.set_yticks([]); ax.set_aspect("equal")
    fig.suptitle(r"Generative modeling: learn the distribution, then sample from it",fontsize=12,y=1.03)
    save(fig,"01-distribution-sampling")

def f_forward_diffusion():
    N=8000; x0=np.concatenate([rng.normal(-2,0.3,N//2),rng.normal(2,0.3,N//2)])
    fig,axes=plt.subplots(1,5,figsize=(11,2.6),sharey=True,sharex=True)
    for ax,a in zip(axes,[1.0,0.9,0.6,0.3,0.0]):
        xt=np.sqrt(a)*x0+np.sqrt(1-a)*rng.normal(0,1.5,N)
        ax.hist(xt,bins=60,density=True,color=ACC,alpha=.8); ax.set_xlim(-5,5); ax.set_yticks([])
        ax.set_title(fr"$\bar\alpha_t={a}$",fontsize=10)
    axes[0].set_ylabel("data"); 
    fig.suptitle(r"Forward diffusion: add noise until data becomes pure Gaussian",fontsize=12,y=1.06)
    save(fig,"02-forward-diffusion")

def f_noise_schedule():
    t=np.linspace(0,1,200); fig,axes=plt.subplots(1,2,figsize=(8.4,3.4))
    beta_lin=0.0001+t*0.02; ax=axes[0]
    ax.plot(t,beta_lin*50,color=ACC,lw=2,label="linear")
    f=np.cos((t+0.008)/1.008*np.pi/2)**2; beta_cos=np.clip(1-f[1:]/f[:-1],0,0.999)
    ax.plot(t[1:],beta_cos*3,color=RED,lw=2,label="cosine")
    ax.set_title(r"noise rate $\beta_t$",fontsize=12); ax.set_xlabel(r"$t$"); ax.legend(frameon=False,fontsize=10)
    ax=axes[1]
    ax.plot(t,np.cumprod(1-beta_lin),color=ACC,lw=2,label="linear")
    ax.plot(t,f,color=RED,lw=2,label="cosine")
    ax.set_title(r"signal retained $\bar\alpha_t$",fontsize=12); ax.set_xlabel(r"$t$"); ax.legend(frameon=False,fontsize=10)
    fig.suptitle("Noise schedule: how fast signal turns to noise",fontsize=12,y=1.04)
    save(fig,"02-noise-schedule")

def f_reverse_sampling():
    fig,ax=plt.subplots(figsize=(6.8,3.6)); x=np.linspace(-4,4,300)
    g=lambda x,m,s:np.exp(-(x-m)**2/(2*s**2))/(s*np.sqrt(2*np.pi))
    for t,al,lab in zip([1.0,0.7,0.4,0.15,0.0],np.linspace(.35,1,5),["noise","","","","image"]):
        d=(1-t)*(0.5*g(x,-2,0.4)+0.5*g(x,2,0.4))+t*g(x,0,1.5)
        ax.plot(x,d,color=ACC,alpha=al,lw=2)
    ax.set_xlabel(r"$x$"); ax.set_ylabel("density")
    ax.set_title(r"Reverse sampling: denoise Gaussian back into structured data",fontsize=12)
    save(fig,"03-reverse-sampling")

def f_cfg():
    x=np.linspace(-4,4,300); g=lambda x,m,s:np.exp(-(x-m)**2/(2*s**2))/(s*np.sqrt(2*np.pi))
    base=0.6*g(x,-0.5,1.2)+0.4*g(x,1.5,0.8)
    fig,ax=plt.subplots(figsize=(6.6,3.6))
    for w,c,lab in [(0,ACC2,"w=0 (unconditional)"),(3,ACC,"w=3"),(8,RED,"w=8 (strong guidance)")]:
        p=base*(g(x,1.5,0.8)/base)**(w*0.12); p/=np.trapezoid(p,x)
        ax.plot(x,p,color=c,lw=2,label=lab)
    ax.set_xlabel(r"$x$"); ax.set_ylabel("density"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Classifier-free guidance: larger $w$ sharpens toward the prompt",fontsize=12)
    save(fig,"03-cfg")

def f_latent():
    from mpl_toolkits.mplot3d import Axes3D  # noqa
    fig=plt.figure(figsize=(8.0,3.6))
    ax=fig.add_subplot(121,projection="3d")
    t=rng.uniform(1.5,4.5,600); h=rng.uniform(0,3,600)
    x=t*np.cos(t); z=t*np.sin(t)
    ax.scatter(x,h,z,c=t,cmap="Greens",s=6); ax.set_title("data in pixel space (high-dim)",fontsize=11); ax.set_axis_off(); ax.view_init(20,-70)
    ax=fig.add_subplot(122)
    ax.scatter(t,h,c=t,cmap="Greens",s=6); ax.set_title("latent space (low-dim)",fontsize=11); ax.set_xticks([]); ax.set_yticks([])
    fig.suptitle(r"Latent diffusion: run diffusion in a compact latent, not on pixels",fontsize=12,y=1.02)
    save(fig,"04-latent")

if __name__=="__main__":
    for fn in [f_distribution_sampling,f_forward_diffusion,f_noise_schedule,f_reverse_sampling,f_cfg,f_latent]:
        try: fn()
        except Exception as e: print("✗",fn.__name__,"→",repr(e))
