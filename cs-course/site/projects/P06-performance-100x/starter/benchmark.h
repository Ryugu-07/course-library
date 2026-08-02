#ifndef P06_BENCHMARK_H
#define P06_BENCHMARK_H

#include <stddef.h>
#include <stdint.h>

typedef struct {
    size_t width;
    size_t height;
    size_t steps;
    uint32_t seed;
} WorkloadConfig;

typedef struct {
    double seconds;
    uint64_t digest;
    uint64_t oracle_digest;
    double max_abs_error;
    size_t work_units;
    int correct;
    int candidate_status;
} BenchmarkResult;

int fill_input(float *grid, size_t count, uint32_t seed);

int baseline_stencil(const float *input, float *output,
                     size_t width, size_t height, size_t steps);

/* Student entry point. The supplied stub must be replaced without changing this contract. */
int student_stencil(const float *input, float *output,
                    size_t width, size_t height, size_t steps);

uint64_t digest_grid(const float *grid, size_t count);

int run_benchmark(const WorkloadConfig *config, int use_student,
                  BenchmarkResult *result);

#endif
