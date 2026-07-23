import sys; sys.path.insert(0,"/Users/karasuakamatsu/ai-course/figs")
from _common import *
rng=np.random.default_rng(3)

def f_find_function():
    x=np.linspace(0,10,40); y=np.sin(0.7*x)+0.4*x+rng.normal(0,0.5,40)
    xs=np.linspace(0,10,200)
    fig,ax=plt.subplots(figsize=(6.4,3.8)); ax.plot(x,y,"o",color=INK,ms=5,label="data")
    coef=np.polyfit(x,y,5); ax.plot(xs,np.polyval(coef,xs),color=ACC,lw=2.4,label=r"learned $f_\theta$")
    ax.set_xlabel(r"input $x$"); ax.set_ylabel(r"output $y$"); ax.legend(frameon=False,fontsize=11)
    ax.set_title(r"Machine learning = finding a function that fits data",fontsize=12)
    save(fig,"01-find-function")

def f_svm_margin():
    c1=rng.normal([1.5,1.5],0.5,(20,2)); c2=rng.normal([4,4],0.5,(20,2))
    fig,ax=plt.subplots(figsize=(5.6,4.4))
    ax.plot(c1[:,0],c1[:,1],"o",color=ACC,ms=6); ax.plot(c2[:,0],c2[:,1],"s",color=RED,ms=6)
    xs=np.linspace(0,6,10); ax.plot(xs,6-xs,color=INK,lw=2,label="max-margin boundary")
    ax.plot(xs,6.9-xs,color=GRID,lw=1,ls="--"); ax.plot(xs,5.1-xs,color=GRID,lw=1,ls="--")
    ax.fill_between(xs,5.1-xs,6.9-xs,color=ACC2,alpha=.2)
    ax.set_xlim(0,6); ax.set_ylim(0,6); ax.set_xticks([]); ax.set_yticks([]); ax.legend(frameon=False,fontsize=10,loc="upper right")
    ax.set_title(r"SVM: widest margin between the two classes",fontsize=12)
    save(fig,"02-svm-margin")

def f_activations():
    x=np.linspace(-4,4,300); fig,ax=plt.subplots(figsize=(6.6,3.8))
    ax.plot(x,1/(1+np.exp(-x)),color=ACC,lw=2,label="sigmoid")
    ax.plot(x,np.tanh(x),color=RED,lw=2,label="tanh")
    ax.plot(x,np.maximum(0,x),color=GREEN,lw=2,label="ReLU")
    ax.plot(x,x*0.5*(1+np.tanh(0.8*(x+0.04*x**3))),color="#7a5a30",lw=2,ls="--",label="GELU")
    ax.axhline(0,color=GRID,lw=.6); ax.axvline(0,color=GRID,lw=.6); ax.set_ylim(-1.5,4)
    ax.set_xlabel(r"$x$"); ax.set_ylabel(r"$\sigma(x)$"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Activation functions: where nonlinearity enters",fontsize=12)
    save(fig,"04-activations")

def f_overfitting():
    ep=np.arange(1,60); fig,ax=plt.subplots(figsize=(6.4,3.8))
    train=1.2*np.exp(-ep/12)+0.05
    val=1.2*np.exp(-ep/12)+0.05+0.5*(1-np.exp(-(ep/30)**2))*0.6+0.02
    val=0.9*np.exp(-ep/10)+0.15+0.012*np.maximum(0,ep-25)
    ax.plot(ep,train,color=ACC,lw=2,label="training loss")
    ax.plot(ep,val,color=RED,lw=2,label="validation loss")
    k=np.argmin(val); ax.axvline(ep[k],color=GRID,lw=1,ls=":"); ax.text(ep[k]+1,0.7,"early stop",fontsize=10,color="#666")
    ax.set_xlabel("epoch"); ax.set_ylabel("loss"); ax.legend(frameon=False,fontsize=11)
    ax.set_title(r"Overfitting: val loss turns up while train keeps dropping",fontsize=12)
    save(fig,"04-overfitting")

def f_positional_encoding():
    pos=np.arange(50); i=np.arange(64); PE=np.zeros((50,64))
    for p in pos:
        PE[p,0::2]=np.sin(p/10000**(np.arange(0,64,2)/64))
        PE[p,1::2]=np.cos(p/10000**(np.arange(0,64,2)/64))
    fig,ax=plt.subplots(figsize=(6.2,3.8)); im=ax.imshow(PE,aspect="auto",cmap="RdBu",origin="lower")
    ax.set_xlabel("encoding dimension"); ax.set_ylabel("position"); fig.colorbar(im,ax=ax,shrink=.8)
    ax.set_title(r"Sinusoidal positional encoding",fontsize=12)
    save(fig,"06-positional-encoding")

def f_attention():
    n=8; rng2=np.random.default_rng(1); S=rng2.normal(0,1,(n,n)); 
    for i in range(n): S[i,max(0,i-2):i+1]+=2  # local + causal-ish
    A=np.exp(S)/np.exp(S).sum(1,keepdims=True)
    fig,ax=plt.subplots(figsize=(5.0,4.4)); im=ax.imshow(A,cmap="Oranges",origin="upper")
    ax.set_xlabel("key position"); ax.set_ylabel("query position"); fig.colorbar(im,ax=ax,shrink=.8)
    ax.set_title(r"Attention weights: softmax over keys per query",fontsize=12)
    save(fig,"06-attention-weights")

def f_scaling_laws():
    C=np.logspace(0,6,50); L=2.5*C**(-0.08)+0.5
    fig,ax=plt.subplots(figsize=(6.4,3.8)); ax.loglog(C,L,color=ACC,lw=2.4)
    ax.set_xlabel(r"compute / params / data (log)"); ax.set_ylabel(r"loss (log)")
    ax.set_title(r"Scaling laws: loss falls as a power law with scale",fontsize=12)
    ax.grid(True,which="both",alpha=.2)
    save(fig,"07-scaling-laws")

def f_gradient_descent_1d():
    x=np.linspace(-3,3,300); f=lambda t:t**2; fig,ax=plt.subplots(figsize=(6.2,3.8))
    ax.plot(x,f(x),color=INK,lw=2)
    for lr,c,lab in [(0.1,ACC,"good lr"),(0.9,RED,"too large (oscillates)")]:
        p=-2.6; pts=[p]
        for _ in range(12): p=p-lr*2*p; pts.append(p)
        pts=np.array(pts); ax.plot(pts,f(pts),"o-",color=c,ms=4,lw=1,label=lab)
    ax.set_xlabel(r"$\theta$"); ax.set_ylabel(r"loss $L(\theta)$"); ax.legend(frameon=False,fontsize=10)
    ax.set_title(r"Gradient descent: learning rate makes or breaks it",fontsize=12)
    save(fig,"04-gradient-descent")

if __name__=="__main__":
    for fn in [f_find_function,f_svm_margin,f_activations,f_overfitting,f_positional_encoding,
               f_attention,f_scaling_laws,f_gradient_descent_1d]:
        try: fn()
        except Exception as e: print("✗",fn.__name__,"→",repr(e))
