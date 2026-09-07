# Heat inverse teaching benchmark v1

This is constructed simulation data, not measurements from a real material.

## Shared physics and notation

We infer the initial **excess temperature** u(x,0) relative to a fixed bath. There is no continuing heat source after t=0. The rod has length L=1 m, constant diffusivity kappa=0.01 m²/s, zero excess temperature at both ends, and no convection or radiation. Negative u means colder than the bath, not negative absolute temperature.

The model is u_t=kappa*u_xx. There are N=16 interior sensors at x_j=jL/17, j=1..16, and M=8 retained sine modes. Q[j,k]=sqrt(2/17)*sin(j*k*pi/17), k=1..8. Q^T Q=I; a_k has units K and u0=Qa. The continuous interpolation uses the same sqrt(2/17) normalization. This eight-mode subspace is an explicit model restriction, not the full infinite-dimensional inverse problem.

s_k(t)=exp(-kappa*(k*pi/L)^2*t). Data y=Q diag(s) a+epsilon. Noise is iid N(0,sigma²) at the 16 sensors, in K. The measured modal vector is b=Q^T y; projected noise has the same variance because Q has orthonormal columns. Validation-in-time readings use t+0.5 s with independent sensor noise and NEVER fit the inverse.

Default t=1 s, sigma=0.02 K, manual lambda=0.001. Controls t in {0.5,1,1.5}, sigma in {0,0.02,0.05}, scenario smooth / high-frequency / wrong-diffusivity, test index 0..31. Changing t or sigma regenerates all splits using unchanged seeds and refits the learned filter. Changing the scenario modifies only held-out test trajectories.

## Three estimators

- Unregularized least squares: a_hat_k=b_k/s_k (all s_k strictly positive in these supported settings).
- Zero-order Tikhonov: minimize ||S a-b||² + lambda ||a||², giving a_hat_k=s_k*b_k/(s_k²+lambda). lambda uses this unwhitened convention; do not silently insert a sigma² factor. It penalizes coefficient magnitude, not spatial derivatives.
- Learned diagonal linear inverse: predict a_hat_k=w_k b_k. Fit w_k=sum_train(b_k*a_k)/sum_train(b_k²). No intercept, no test labels and no validation rows used in fitting. This is supervised regression with eight learned scalars, not a neural network. Its inductive bias excludes cross-mode interactions. The smooth synthetic training distribution implicitly supplies a prior.

The regularization parameter chosen for the benchmark is selected from [1e-6,1e-5,1e-4,1e-3,1e-2,1e-1] using average initial-field MSE on validation trajectories, with the smaller lambda winning ties. Synthetic validation labels are available by design. Manual lambda is for exploration; the benchmark table uses the validation-selected lambda. Never select using the test RMSE. Do not claim universal superiority of either estimator.

## Deterministic splits and generator

128 training, 32 validation, 32 test complete trajectories. Each trajectory has its own independent PRNG instance. No sensor rows from a trajectory cross splits.

Seeds: train=101, validation=202, test=303; trajectory i starts from (split_seed+104729*i) modulo 2^32. LCG: state=(1664525*state+1013904223) modulo 2^32; uniform=(state+0.5)/2^32. Each normal uses two fresh uniforms, sqrt(-2 log u1)*cos(2*pi*u2), discarding the sine partner. No library-specific Gaussian RNG.

Draw a1=6+0.6*z1; a2=1.5*z2; a_k=1.5*z_k/(k-1)^2 for k=3..8. Then draw 16 noise normals for y, then 16 new normals for the held-out time. Draw all normals even when sigma=0 so the stream definition stays fixed.

Test scenarios:

- smooth: the same generative family and diffusivity as training.
- high-frequency: add +6 K to a6 for even test indices, -6 K for odd indices; all other generation is unchanged.
- wrong-diffusivity: true kappa=0.016 m²/s for test data at both times, while all estimators assume 0.01. Coefficient distribution stays smooth. This isolates forward-model misspecification.

## Metrics and outputs

Report initial-field RMSE sqrt(mean_j((Q a_hat-u0)_j²)) in K, in-sample observation residual RMS in K, and held-out-time predictive RMSE against the *noisy* new observations in K. The noise floor of the latter remains even for a perfect model. A later time smooths high frequencies further; good future prediction does not prove correct initial-field detail.

Aggregate test metrics as sqrt(mean over all trajectories and sensors of squared error), not as the mean of per-trajectory RMSEs. The truth and initial-field RMSE exist only because this is a simulation benchmark. A real experiment needs independent physical evidence, not access to hidden ground truth.

Exports: protocol version/config, split/index, x_m, initial_K, observed_K, future_observed_K and each estimator's initial reconstruction. Test data are for evaluation, not fitting. The complete default benchmark is downloadable and reproducible with the independent NumPy reference script.

## Pages and implementation ownership

- math-course/lectures/project-01-heat-inverse.md: mode attenuation, projection, SVD, least squares and the derivative yielding the Tikhonov filter; two-mode worked example and transfer problem.
- physics-course/lectures/project-01-heat-inverse.md: physical setup, units/boundaries, separation-of-variables derivation, sensor chain, model error and held-out time.
- ai-course/lectures/project-01-heat-inverse.md: whole-trajectory splits, learned diagonal inverse, validation selection, distribution shift, comparison protocol and experiment report.
- Every page has one data-learning-page marker, one learning-layer, and one learning-lab with data-learning-lab="heat-inverse-project"; shared JS mounts identical experiments. Cross links use ../../OTHER/site/project-01-heat-inverse.html. Downloads use assets/learning/projects/heat-inverse/.

## Further reading

The simulation and dataset above are original teaching constructions. For the underlying methods, see [Ivrii: heat equation separation of variables](https://www.math.toronto.edu/ivrii/PDE-textbook/Chapter6/S6.1.html), [Hansen: regularization methods](https://www2.imm.dtu.dk/~pcha/DIP/chap4.pdf), and [scikit-learn: avoiding data leakage](https://scikit-learn.org/stable/common_pitfalls.html). Regularization parameter conventions differ between texts; this benchmark uses the explicitly stated lambda convention above.
