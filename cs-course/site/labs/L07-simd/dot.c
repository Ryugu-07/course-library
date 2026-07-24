#define _POSIX_C_SOURCE 200809L
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#if defined(__aarch64__)
#include <arm_neon.h>
#elif defined(__AVX2__)
#include <immintrin.h>
#endif

#if defined(__clang__)
#define BASELINE __attribute__((noinline, optnone))
#else
#define BASELINE __attribute__((noinline, optimize("O0")))
#endif

static double now_seconds(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (double)ts.tv_sec + (double)ts.tv_nsec * 1e-9;
}

BASELINE static float dot_scalar(const float *a, const float *b, size_t n) {
    float sum = 0.0f;
    for (size_t i = 0; i < n; ++i) sum += a[i] * b[i];
    return sum;
}

static float dot_auto(const float *restrict a, const float *restrict b, size_t n) {
    float sum = 0.0f;
    for (size_t i = 0; i < n; ++i) sum += a[i] * b[i];
    return sum;
}

static float dot_intrinsics(const float *a, const float *b, size_t n) {
    size_t i = 0;
    float sum = 0.0f;
#if defined(__aarch64__)
    float32x4_t accumulator = vdupq_n_f32(0.0f);
    for (; i + 4 <= n; i += 4)
        accumulator = vfmaq_f32(accumulator, vld1q_f32(a + i), vld1q_f32(b + i));
    sum = vaddvq_f32(accumulator);
#elif defined(__AVX2__)
    __m256 accumulator = _mm256_setzero_ps();
    for (; i + 8 <= n; i += 8) {
        __m256 av = _mm256_loadu_ps(a + i);
        __m256 bv = _mm256_loadu_ps(b + i);
#if defined(__FMA__)
        accumulator = _mm256_fmadd_ps(av, bv, accumulator);
#else
        accumulator = _mm256_add_ps(accumulator, _mm256_mul_ps(av, bv));
#endif
    }
    float lanes[8];
    _mm256_storeu_ps(lanes, accumulator);
    for (int lane = 0; lane < 8; ++lane) sum += lanes[lane];
#else
    return dot_auto(a, b, n);
#endif
    for (; i < n; ++i) sum += a[i] * b[i];
    return sum;
}

typedef float (*dot_fn)(const float *, const float *, size_t);

static volatile float benchmark_sink;

static int compare_double(const void *left, const void *right) {
    const double a = *(const double *)left;
    const double b = *(const double *)right;
    return (a > b) - (a < b);
}

static double benchmark(dot_fn fn, const float *a, const float *b, size_t n, float *answer) {
    const double minimum_sample_seconds = 0.05;
    const int sample_count = 7;
    dot_fn volatile dispatch = fn;
    size_t iterations = 1;
    *answer = dispatch(a, b, n);

    for (;;) {
        double start = now_seconds();
        float aggregate = 0.0f;
        for (size_t iteration = 0; iteration < iterations; ++iteration)
            aggregate += dispatch(a, b, n);
        double elapsed = now_seconds() - start;
        benchmark_sink = aggregate;
        if (elapsed >= minimum_sample_seconds || iterations >= (1u << 20)) break;
        iterations *= 2;
    }

    double samples[sample_count];
    for (int sample = 0; sample < sample_count; ++sample) {
        double start = now_seconds();
        float aggregate = 0.0f;
        for (size_t iteration = 0; iteration < iterations; ++iteration)
            aggregate += dispatch(a, b, n);
        double elapsed = now_seconds() - start;
        benchmark_sink = aggregate;
        samples[sample] = elapsed / (double)iterations;
    }
    qsort(samples, sample_count, sizeof(samples[0]), compare_double);
    return samples[sample_count / 2];
}

static double dot_reference(const float *a, const float *b, size_t n) {
    double sum = 0.0;
    for (size_t i = 0; i < n; ++i) sum += (double)a[i] * (double)b[i];
    return sum;
}

static double relative_error(float value, double reference) {
    return fabs((double)value - reference) / fmax(1.0, fabs(reference));
}

int main(int argc, char **argv) {
    size_t n = 1u << 20;
    int check = 0;
    for (int i = 1; i < argc; ++i) {
        if (strcmp(argv[i], "--check") == 0) {
            check = 1;
            n = 1003;
        } else if (strcmp(argv[i], "--size") == 0 && i + 1 < argc) {
            n = strtoull(argv[++i], NULL, 10);
        } else {
            fprintf(stderr, "usage: %s [--check] [--size N]\n", argv[0]);
            return 2;
        }
    }
    if (n == 0) {
        fprintf(stderr, "size must be positive\n");
        return 2;
    }
    float *a = malloc(n * sizeof(*a));
    float *b = malloc(n * sizeof(*b));
    if (!a || !b) return 1;
    for (size_t i = 0; i < n; ++i) {
        a[i] = (float)((int)(i % 97) - 48) / 97.0f;
        b[i] = (float)((int)(i % 89) - 44) / 89.0f;
    }
    float scalar, automatic, manual;
    double t_scalar = benchmark(dot_scalar, a, b, n, &scalar);
    double t_auto = benchmark(dot_auto, a, b, n, &automatic);
    double t_manual = benchmark(dot_intrinsics, a, b, n, &manual);
    double reference = dot_reference(a, b, n);
    double scalar_error = relative_error(scalar, reference);
    double auto_error = relative_error(automatic, reference);
    double manual_error = relative_error(manual, reference);
    const double tolerance = 3e-3;
    int ok = scalar_error <= tolerance && auto_error <= tolerance && manual_error <= tolerance
          && isfinite(t_scalar) && isfinite(t_auto) && isfinite(t_manual)
          && t_scalar > 0.0 && t_auto > 0.0 && t_manual > 0.0;
    if (check) {
        printf("simd correctness: %s (reference=%.9g scalar=%g auto=%g manual=%g)\n",
               ok ? "PASS" : "FAIL", reference, scalar, automatic, manual);
    } else {
        printf("kernel,median_seconds,speedup_vs_scalar,result,relative_error\n");
        printf("scalar,%.9f,1.00,%g,%.3e\n", t_scalar, scalar, scalar_error);
        printf("auto,%.9f,%.2f,%g,%.3e\n", t_auto, t_scalar / t_auto, automatic, auto_error);
        printf("intrinsics,%.9f,%.2f,%g,%.3e\n",
               t_manual, t_scalar / t_manual, manual, manual_error);
        printf("reference,0,0,%.9g,0\n", reference);
    }
    free(a);
    free(b);
    return ok ? 0 : 1;
}
