import numpy as np
def jn(n,x):
    # 数值积分 Bessel J_n(x)=1/pi ∫_0^pi cos(n t - x sin t) dt
    t=np.linspace(0,np.pi,400)
    x=np.atleast_1d(x).astype(float)
    return np.array([np.trapezoid(np.cos(n*t-xi*np.sin(t)),t)/np.pi for xi in x])
