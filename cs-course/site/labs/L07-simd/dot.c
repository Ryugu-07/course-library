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

static double benchmark(dot_fn fn, const float *a, const float *b, size_t n, float *answer) {
    double best = 1e30;
    for (int repeat = 0; repeat < 3; ++repeat) {
        double start = now_seconds();
        *answer = fn(a, b, n);
        double elapsed = now_seconds() - start;
        if (elapsed < best) best = elapsed;
    }
    return best;
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
    float tolerance = 2e-4f * (1.0f + fabsf(scalar));
    int ok = fabsf(scalar - automatic) <= tolerance && fabsf(scalar - manual) <= tolerance;
    if (check) {
        printf("simd correctness: %s (scalar=%g auto=%g manual=%g)\n",
               ok ? "PASS" : "FAIL", scalar, automatic, manual);
    } else {
        printf("kernel,seconds,speedup_vs_scalar,result\n");
        printf("scalar,%.6f,1.00,%g\n", t_scalar, scalar);
        printf("auto,%.6f,%.2f,%g\n", t_auto, t_scalar / t_auto, automatic);
        printf("intrinsics,%.6f,%.2f,%g\n", t_manual, t_scalar / t_manual, manual);
    }
    free(a);
    free(b);
    return ok ? 0 : 1;
}

