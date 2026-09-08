"""Regenerate small-chain test references with NumPy SVD (not the JS density eigensolver).
Run with a Python environment containing numpy; not required by the site builder.
"""
from pathlib import Path
import json
import numpy as np
I = np.eye(2)
X = np.array([[0., 1.], [1., 0.]])
Z = np.diag([1., -1.])


def tensor(ops):
    result = np.ones((1, 1))
    for op in ops:
        result = np.kron(result, op)
    return result


def basis(psi, cut, side):
    u, sigma, vh = np.linalg.svd(psi.reshape(2**cut, -1), full_matrices=False)
    keep = sigma**2 > 1e-12
    return u[:, keep] if side == "left" else vh[keep, :].T


def generate():
    output = []
    for g in [.2, .5, 1, 1.5, 2]:
        h = -sum(g*tensor([Z if i == j else I for i in range(4)]) for j in range(4))
        h -= sum(tensor([X if i in (j, j+1) else I for i in range(4)]) for j in range(3))
        ground = np.linalg.eigvalsh(h)[0]
        for chi in [1, 2, 3, 4]:
            for guard in [0, 1]:
                p = tensor([np.array([[np.cos(np.pi/6)], [np.sin(np.pi/6)]])]*4).ravel()
                history = []
                for j in [0, 1, 2, 1, 0]*2:
                    left, right = basis(p, j, "left"), basis(p, j+2, "right")
                    w = np.kron(np.kron(left, np.eye(4)), right)
                    e, v = np.linalg.eigh(w.T @ h @ w)
                    matrix = v[:, 0].reshape(left.shape[1]*2, right.shape[1]*2)
                    u, sigma, vh = np.linalg.svd(matrix, full_matrices=False)
                    keep = min(chi, len(sigma))
                    truncated = (u[:, :keep]*sigma[:keep]) @ vh[:keep]
                    trial = w @ (truncated / np.linalg.norm(truncated)).ravel()
                    old_energy, trial_energy = p @ h @ p, trial @ h @ trial
                    accept = not guard or trial_energy <= old_energy + 1e-10
                    if accept:
                        p = trial
                    history.append(dict(before=float(old_energy), optimized=float(e[0]),
                                        trial=float(trial_energy), after=float(p @ h @ p),
                                        epsilon=float(sum(sigma[keep:]**2)),
                                        accepted=bool(accept), dimension=w.shape[1]))
                energy = p @ h @ p
                output.append(dict(g=g, chi=chi, guard=guard, E=float(energy),
                                   ground=float(ground), residual=float(np.linalg.norm(h @ p-energy*p)),
                                   history=history))
    return output


if __name__ == "__main__":
    target = Path(__file__).parent / "fixtures" / "sweeps-numpy.json"
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(generate(), separators=(",", ":"))+"\n")
    print(target)
