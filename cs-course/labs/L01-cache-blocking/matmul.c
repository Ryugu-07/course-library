#define _POSIX_C_SOURCE 200809L
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

typedef void (*kernel_fn)(const double *, const double *, double *, int, int);

static double now_seconds(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (double)ts.tv_sec + (double)ts.tv_nsec * 1e-9;
}

static void zero(double *c, int n) {
    memset(c, 0, (size_t)n * (size_t)n * sizeof(*c));
}

static void matmul_ijk(const double *a, const double *b, double *c, int n, int block) {
    (void)block;
    zero(c, n);
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            for (int k = 0; k < n; ++k)
                c[(size_t)i * n + j] += a[(size_t)i * n + k] * b[(size_t)k * n + j];
}

static void matmul_ikj(const double *a, const double *b, double *c, int n, int block) {
    (void)block;
    zero(c, n);
    for (int i = 0; i < n; ++i)
        for (int k = 0; k < n; ++k) {
            const double aik = a[(size_t)i * n + k];
            for (int j = 0; j < n; ++j)
                c[(size_t)i * n + j] += aik * b[(size_t)k * n + j];
        }
}

static int minimum(int a, int b) { return a < b ? a : b; }

static void matmul_blocked(const double *a, const double *b, double *c, int n, int block) {
    zero(c, n);
    for (int ii = 0; ii < n; ii += block)
        for (int kk = 0; kk < n; kk += block)
            for (int jj = 0; jj < n; jj += block)
                for (int i = ii; i < minimum(ii + block, n); ++i)
                    for (int k = kk; k < minimum(kk + block, n); ++k) {
                        const double aik = a[(size_t)i * n + k];
                        for (int j = jj; j < minimum(jj + block, n); ++j)
                            c[(size_t)i * n + j] += aik * b[(size_t)k * n + j];
                    }
}

static void fill(double *matrix, int n, unsigned seed) {
    for (int i = 0; i < n * n; ++i) {
        seed = seed * 1664525u + 1013904223u;
        matrix[i] = (double)(seed & 0xffffu) / 65536.0 - 0.5;
    }
}

static int close_enough(const double *a, const double *b, int n) {
    for (int i = 0; i < n * n; ++i)
        if (fabs(a[i] - b[i]) > 1e-9 * (1.0 + fabs(a[i])))
            return 0;
    return 1;
}

static double benchmark(kernel_fn fn, const double *a, const double *b, double *c, int n, int block) {
    const double start = now_seconds();
    fn(a, b, c, n, block);
    return now_seconds() - start;
}

int main(int argc, char **argv) {
    int n = 512;
    int block = 32;
    int check = 0;
    for (int i = 1; i < argc; ++i) {
        if (strcmp(argv[i], "--check") == 0) {
            check = 1;
            n = 31;
            block = 7;
        } else if (strcmp(argv[i], "--size") == 0 && i + 1 < argc) {
            n = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--block") == 0 && i + 1 < argc) {
            block = atoi(argv[++i]);
        } else {
            fprintf(stderr, "usage: %s [--check] [--size N] [--block B]\n", argv[0]);
            return 2;
        }
    }
    if (n <= 0 || block <= 0) {
        fprintf(stderr, "size and block must be positive\n");
        return 2;
    }

    const size_t bytes = (size_t)n * (size_t)n * sizeof(double);
    double *a = malloc(bytes), *b = malloc(bytes);
    double *c1 = malloc(bytes), *c2 = malloc(bytes), *c3 = malloc(bytes);
    if (!a || !b || !c1 || !c2 || !c3) {
        fprintf(stderr, "allocation failed\n");
        free(a); free(b); free(c1); free(c2); free(c3);
        return 1;
    }
    fill(a, n, 1u);
    fill(b, n, 2u);
    double t1 = benchmark(matmul_ijk, a, b, c1, n, block);
    double t2 = benchmark(matmul_ikj, a, b, c2, n, block);
    double t3 = benchmark(matmul_blocked, a, b, c3, n, block);
    int ok = close_enough(c1, c2, n) && close_enough(c1, c3, n);
    if (check)
        printf("correctness,%s,n=%d,block=%d\n", ok ? "PASS" : "FAIL", n, block);
    else {
        printf("kernel,n,block,seconds,speedup_vs_ijk\n");
        printf("ijk,%d,%d,%.6f,1.00\n", n, block, t1);
        printf("ikj,%d,%d,%.6f,%.2f\n", n, block, t2, t1 / t2);
        printf("blocked,%d,%d,%.6f,%.2f\n", n, block, t3, t1 / t3);
    }
    free(a); free(b); free(c1); free(c2); free(c3);
    return ok ? 0 : 1;
}

