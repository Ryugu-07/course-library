#!/usr/bin/env python3
"""Independent NumPy reference for Heat inverse teaching benchmark v1.

From the repository root (with NumPy installed):
    python course-shared/projects/heat-inverse/reference.py --check
    python course-shared/projects/heat-inverse/reference.py --export course-shared/projects/heat-inverse/benchmark-default.json

No network, plotting, neural-network framework, or third-party RNG is used.
This script follows PROTOCOL.md and does not import the browser implementation.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np

VERSION = "heat-inverse-v1"
N, M = 16, 8
L, KAPPA = 1.0, 0.01
FUTURE_DT = 0.5
LAMBDAS = (1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 1e-1)
SPLITS = {"train": (101, 128), "validation": (202, 32), "test": (303, 32)}
SCENARIOS = ("smooth", "high-frequency", "wrong-diffusivity")
METHODS = ("least_squares", "tikhonov", "learned")
METRIC_NAMES = ("initial_rmse_K", "observation_residual_rms_K", "future_predictive_rmse_K")
X = np.arange(1, N + 1, dtype=float) * L / (N + 1)
MODES = np.arange(1, M + 1, dtype=float)
Q = np.sqrt(2 / (N + 1)) * np.sin(np.outer(X, MODES) * np.pi / L)


class ProtocolRNG:
    """32-bit LCG, fresh Box-Muller uniforms for every normal."""

    def __init__(self, seed):
        self.state = int(seed) & 0xFFFFFFFF

    def uniform(self):
        self.state = (1664525 * self.state + 1013904223) & 0xFFFFFFFF
        return (self.state + 0.5) / 4294967296

    def normal(self):
        u1, u2 = self.uniform(), self.uniform()
        return math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)


def attenuation(t, kappa=KAPPA):
    return np.exp(-kappa * (MODES * np.pi / L) ** 2 * t)


def generate(split, t, sigma, scenario="smooth"):
    """Generate complete independent trajectories; scenario only changes test."""
    if split not in SPLITS or scenario not in SCENARIOS:
        raise ValueError("Unknown split or scenario")
    if split != "test" and scenario != "smooth":
        raise ValueError("Distribution shifts apply only to held-out test trajectories")
    seed, count = SPLITS[split]
    rows = []
    for i in range(count):
        rng = ProtocolRNG(seed + 104729 * i)
        z = np.array([rng.normal() for _ in range(M)])
        a = 1.5 * z / np.maximum(MODES - 1, 1) ** 2
        a[0] = 6 + 0.6 * z[0]
        if scenario == "high-frequency":
            a[5] += 6 if i % 2 == 0 else -6
        true_kappa = 0.016 if scenario == "wrong-diffusivity" else KAPPA
        # Always draw both complete noise vectors, including when sigma == 0.
        noise = np.array([rng.normal() for _ in range(N)])
        future_noise = np.array([rng.normal() for _ in range(N)])
        observed = Q @ (attenuation(t, true_kappa) * a) + sigma * noise
        future = Q @ (attenuation(t + FUTURE_DT, true_kappa) * a) + sigma * future_noise
        rows.append({"split": split, "index": i, "scenario": scenario,
                     "true_kappa_m2_per_s": true_kappa, "coefficients_K": a,
                     "initial_K": Q @ a, "observed_K": observed,
                     "future_observed_K": future})
    return rows


def fit_learned(training_rows):
    """Eight scalar regressions, fitted exclusively to training labels."""
    if any(row["split"] != "train" for row in training_rows):
        raise ValueError("Learned fitting accepts training trajectories only")
    b = np.stack([Q.T @ row["observed_K"] for row in training_rows])
    a = np.stack([row["coefficients_K"] for row in training_rows])
    return np.sum(b * a, axis=0) / np.sum(b * b, axis=0)


def reconstruct(observed, t, method, regularization, learned_weights):
    b, s = Q.T @ observed, attenuation(t)
    if method == "least_squares":
        return b / s
    if method == "tikhonov":
        return s * b / (s * s + regularization)
    if method == "learned":
        return learned_weights * b
    raise ValueError("Unknown estimator")


def select_lambda(validation_rows, t):
    """Only synthetic validation labels select lambda; smaller wins exact ties."""
    if any(row["split"] != "validation" for row in validation_rows):
        raise ValueError("Lambda selection accepts validation trajectories only")
    scores = []
    for candidate in LAMBDAS:
        errors = [Q @ reconstruct(row["observed_K"], t, "tikhonov", candidate, None)
                  - row["initial_K"] for row in validation_rows]
        scores.append({"lambda": candidate, "initial_field_mse_K2": float(np.mean(np.square(errors)))})
    selected = min(scores, key=lambda score: (score["initial_field_mse_K2"], score["lambda"]))
    return selected["lambda"], scores


def squared_errors(row, a_hat, t):
    return (np.square(Q @ a_hat - row["initial_K"]),
            np.square(Q @ (attenuation(t) * a_hat) - row["observed_K"]),
            np.square(Q @ (attenuation(t + FUTURE_DT) * a_hat) - row["future_observed_K"]))


def export_rows(rows, t, selected_lambda, weights):
    records, accumulators = [], {method: [] for method in METHODS}
    for row in rows:
        item = {key: value.tolist() if isinstance(value, np.ndarray) else value for key, value in row.items()}
        item["x_m"] = X.tolist()
        item["estimators"] = {}
        for method in METHODS:
            a_hat = reconstruct(row["observed_K"], t, method, selected_lambda, weights)
            errors = squared_errors(row, a_hat, t)
            accumulators[method].append(errors)
            item["estimators"][method] = {
                "coefficients_K": a_hat.tolist(), "initial_K": (Q @ a_hat).tolist(),
                "metrics": {name: float(np.sqrt(np.mean(error))) for name, error in zip(METRIC_NAMES, errors)}}
        records.append(item)
    # Shape = (trajectories, metric, sensor); average squared errors first.
    aggregate = {method: dict(zip(METRIC_NAMES, np.sqrt(np.mean(values, axis=(0, 2))).tolist()))
                 for method, values in accumulators.items()}
    return records, aggregate


def build_benchmark(t=1.0, sigma=0.02):
    if t not in (0.5, 1.0, 1.5) or sigma not in (0.0, 0.02, 0.05):
        raise ValueError("Use a time and noise level supported by PROTOCOL.md")
    train, validation = generate("train", t, sigma), generate("validation", t, sigma)
    weights = fit_learned(train)
    selected, scores = select_lambda(validation, t)
    result = {
        "protocol_version": VERSION,
        "data_kind": "constructed simulation; not physical measurements",
        "config": {"L_m": L, "assumed_kappa_m2_per_s": KAPPA, "N": N, "M": M,
                   "time_s": t, "future_time_s": t + FUTURE_DT, "noise_sigma_K": sigma,
                   "manual_lambda": 0.001, "lambda_candidates": list(LAMBDAS),
                   "split_seeds": {key: value[0] for key, value in SPLITS.items()},
                   "split_counts": {key: value[1] for key, value in SPLITS.items()},
                   "test_scenarios": list(SCENARIOS)},
        "fitted": {"learned_weights": weights.tolist(), "validation_selected_lambda": selected,
                   "validation_scores": scores, "learned_fit_split": "train", "lambda_selection_split": "validation"},
        "metric_aggregation": "sqrt(mean squared error over all trajectories and all 16 sensors)",
        "tikhonov_table_lambda": "validation_selected_lambda",
        "splits": {}, "metrics": {}}
    result["splits"]["train"], _ = export_rows(train, t, selected, weights)
    result["splits"]["validation"], _ = export_rows(validation, t, selected, weights)
    result["splits"]["test"] = {}
    for scenario in SCENARIOS:
        rows = generate("test", t, sigma, scenario)
        result["splits"]["test"][scenario], result["metrics"][scenario] = export_rows(rows, t, selected, weights)
    return result


def check(result):
    """Numerical invariants plus split isolation and exported-metric recomputation."""
    np.testing.assert_allclose(Q.T @ Q, np.eye(M), atol=2e-15)
    t, sigma = result["config"]["time_s"], result["config"]["noise_sigma_K"]
    rates = KAPPA * (MODES * np.pi / L) ** 2
    np.testing.assert_allclose(attenuation(t + FUTURE_DT), attenuation(t) * attenuation(FUTURE_DT), rtol=2e-15)
    # Central-difference time derivative agrees with the exact heat-equation modal derivative.
    h = 1e-5
    np.testing.assert_allclose((attenuation(t + h) - attenuation(t - h)) / (2 * h),
                               -rates * attenuation(t), rtol=2e-8)
    for row in generate("test", t, 0):
        recovered = reconstruct(row["observed_K"], t, "least_squares", 0, None)
        np.testing.assert_allclose(recovered, row["coefficients_K"], atol=2e-11)
    # Calling the fitting APIs with another split is explicitly rejected.
    for function, rows, arguments in [(fit_learned, generate("test", t, sigma), ()),
                                      (select_lambda, generate("train", t, sigma), (t,))]:
        try:
            function(rows, *arguments)
        except ValueError:
            pass
        else:
            raise AssertionError("Fitting API accepted the wrong split")
    train, validation = generate("train", t, sigma), generate("validation", t, sigma)
    before_w, (before_lambda, _) = fit_learned(train), select_lambda(validation, t)
    for scenario in SCENARIOS:
        # Even arbitrarily corrupted test labels cannot enter either fit API.
        test = generate("test", t, sigma, scenario)
        for row in test:
            row["coefficients_K"][:] = np.nan
            row["initial_K"][:] = np.nan
        np.testing.assert_array_equal(fit_learned(train), before_w)
        assert select_lambda(validation, t)[0] == before_lambda
    np.testing.assert_array_equal(before_w, result["fitted"]["learned_weights"])
    assert before_lambda == result["fitted"]["validation_selected_lambda"]
    # Recompute metrics from serialized fields, independently of export_rows/squared_errors.
    for scenario, rows in result["splits"]["test"].items():
        for method in METHODS:
            all_errors = []
            for row in rows:
                estimate = row["estimators"][method]
                a = np.array(estimate["coefficients_K"])
                predicted_initial = np.array(estimate["initial_K"])
                np.testing.assert_allclose(predicted_initial, Q @ a, atol=1e-13)
                errors = [predicted_initial - row["initial_K"],
                          Q @ (attenuation(t) * a) - row["observed_K"],
                          Q @ (attenuation(t + FUTURE_DT) * a) - row["future_observed_K"]]
                per_row = np.sqrt(np.mean(np.square(errors), axis=1))
                np.testing.assert_allclose(per_row, [estimate["metrics"][name] for name in METRIC_NAMES])
                all_errors.append(errors)
            recomputed = np.sqrt(np.mean(np.square(all_errors), axis=(0, 2)))
            np.testing.assert_allclose(recomputed, [result["metrics"][scenario][method][name] for name in METRIC_NAMES])
    # JSON must be standards-compliant and reproducibly serializable (no NaN/Infinity).
    json.dumps(result, allow_nan=False)
    print("CHECK PASS: orthogonality, analytic decay, noiseless inverse, split isolation, exported metrics, finite JSON")


def report(result):
    cfg, fitted = result["config"], result["fitted"]
    print(f"{VERSION}: t={cfg['time_s']:g} s, sigma={cfg['noise_sigma_K']:g} K")
    print(f"Validation-selected lambda: {fitted['validation_selected_lambda']:g}")
    print("Scenario             Estimator       Initial RMSE   Residual RMS   Future RMSE (K)")
    for scenario in SCENARIOS:
        for method in METHODS:
            metrics = result["metrics"][scenario][method]
            values = " ".join(f"{metrics[key]:14.8f}" for key in METRIC_NAMES)
            print(f"{scenario:20s} {method:14s}{values}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="Run numerical and data-isolation self-checks")
    parser.add_argument("--export", type=Path, help="Write complete split data and metrics as JSON")
    parser.add_argument("--time", type=float, choices=(0.5, 1.0, 1.5), default=1.0)
    parser.add_argument("--sigma", type=float, choices=(0.0, 0.02, 0.05), default=0.02)
    args = parser.parse_args()
    result = build_benchmark(args.time, args.sigma)
    if args.check:
        check(result)
    report(result)
    if args.export:
        args.export.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
        print(f"Exported complete data: {args.export}")


if __name__ == "__main__":
    main()
