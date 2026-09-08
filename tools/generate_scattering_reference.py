"""Independent 70-digit Feynman-parameter quadrature, not the JS closed forms."""
import json
from pathlib import Path
import mpmath as mp

mp.mp.dps = 70

def bubble(r):
    r = mp.mpf(str(r))
    if r == 4:
        # At threshold the zero is double: integrate log((2x-1)^2).
        return mp.mpc(-2, 0)
    cuts = [mp.mpf(0), mp.mpf(".5"), mp.mpf(1)]
    if r > 4:
        beta = mp.sqrt(1 - 4/r)
        cuts = [mp.mpf(0), (1-beta)/2, (1+beta)/2, mp.mpf(1)]
    def logabs(x):
        a = 1-r*x*(1-x)
        return mp.log(abs(a)) if a else mp.mpf(0)  # isolated endpoint, measure zero
    real = mp.quad(logabs, cuts)
    # Integrate the branch indicator separately; no arbitrary finite i*epsilon.
    imag = -mp.pi * (cuts[2]-cuts[1]) if r > 4 else mp.mpf(0)
    return mp.mpc(real, imag)

def pack(z):
    return [float(mp.re(z)), float(mp.im(z))]

rs = [-10000, -64, -16, -4, -1, -.01, -.0099, -1e-6, 0, 1e-8, .0099, .01, .5, 2, 3.9, 3.9999, 4, 4.0001, 4.1, 8, 16, 100, 10000]
references = {'precision': 70, 'method': 'split Feynman-parameter log-absolute quadrature and branch interval',
              'bubbles': [{'r': r, 'value': pack(bubble(r))} for r in rs], 'scattering': []}
for r in [4.2, 8, 16]:
    for z in [-1, -.3, 0, 1]:
        for mu, coupling in [(.5, .2), (1, 1), (4, 2)]:
            s = mp.mpf(str(r)); cosine = mp.mpf(str(z)); l = mp.mpf(str(coupling))
            t = -(s-4)*(1-cosine)/2; u = -(s-4)*(1+cosine)/2
            loop = l*l/(32*mp.pi**2)*(3*bubble(-mp.mpf(str(mu))**2)-bubble(s)-bubble(t)-bubble(u))
            squared = l*l-2*l*mp.re(loop)
            references['scattering'].append({'r': r, 'z': z, 'mu': mu, 'lambda': coupling,
                'loop': pack(loop), 'nloSquared': float(squared), 'dsNlo': float(squared/(128*mp.pi**2*s))})
target = Path(__file__).parent/'fixtures/scattering-mpmath.json'
target.write_text(json.dumps(references, indent=2)+'\n')
print(f'{len(rs)} bubbles and {len(references["scattering"])} scattering references -> {target}')
