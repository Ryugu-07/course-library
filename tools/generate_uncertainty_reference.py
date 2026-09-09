"""Independent full-matrix GLS via Cholesky whitening and SVD; run with NumPy/SciPy."""
from pathlib import Path
import json
import numpy as np
import scipy
from scipy.linalg import cholesky, solve_triangular
from scipy.integrate import quad
x=np.arange(6,dtype=float)
y=np.array([1.02,2.44,4.07,5.70,7.59,9.46])
rows=[]
for degree in [1,2]:
    design=np.vander(x,degree+1,increasing=True)
    for sigma in [.02,.12,.5]:
        for rho in [0,.1,.5,.8,.9,.95]:
            covariance=sigma**2*((1-rho)*np.eye(6)+rho*np.ones((6,6)))
            lower=cholesky(covariance,lower=True)
            wx=solve_triangular(lower,design,lower=True)
            wy=solve_triangular(lower,y,lower=True)
            u,s,vh=np.linalg.svd(wx,full_matrices=False)
            coeff=vh.T@((u.T@wy)/s)
            pcov=(vh.T/s**2)@vh
            residual=wy-wx@coeff
            rows.append(dict(model='linear' if degree==1 else 'quadratic',sigma=sigma,rho=rho,coefficients=coeff.tolist(),parameterCovariance=pcov.tolist(),chiSquare=float(residual@residual)))
pendulum=[]
for theta in [.01,.05,.1,.2]:
    ratio=2/np.pi*quad(lambda z:1/np.sqrt(1-np.sin(theta/2)**2*np.sin(z)**2),0,np.pi/2,epsabs=1e-14)[0]
    pendulum.append(dict(theta=theta,periodRatio=ratio,naiveGravityRatio=1/ratio**2))
out=Path(__file__).parent/'fixtures/uncertainty-gls-scipy.json'
out.write_text(json.dumps(dict(scipy=scipy.__version__,method='full covariance Cholesky whitening, design SVD',fits=rows,pendulum=pendulum),indent=2)+'\n')
print(len(rows),'GLS references;',len(pendulum),'elliptic integrals')
