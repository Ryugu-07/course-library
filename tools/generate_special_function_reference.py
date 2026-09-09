"""Independent special-function values from SciPy, no lab implementation import."""
import json
from pathlib import Path
import numpy as np
import scipy
from scipy.special import jv, jn_zeros, eval_legendre
ref = {"scipy": scipy.__version__,
       "bessel": [{"x": float(x), "j0": float(jv(0,x)), "j1": float(jv(1,x))} for x in np.linspace(-20,20,801)],
       "roots": {str(n): jn_zeros(n,6).tolist() for n in [0,1]},
       "legendre": [{"n": n, "x": float(x), "value": float(eval_legendre(n,x))} for n in range(21) for x in np.linspace(-1,1,41)]}
Path(__file__).with_name("fixtures").joinpath("special-functions-scipy.json").write_text(json.dumps(ref,indent=2)+"\n")
print("Wrote SciPy Bessel, zeros and Legendre references")
