#include "benchmark.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static double absolute_value(double value) {
    return value < 0.0 ? -value : value;
}

static double compare_grids(const float *actual, const float *expected, size_t count) {
    size_t index;
    double maximum = 0.0;
    for (index = 0; index < count; ++index) {
        double difference = absolute_value((double)actual[index] - (double)expected[index]);
        if (difference > maximum) {
            maximum = difference;
        }
    }
    return maximum;
}

int run_benchmark(const WorkloadConfig *config, int use_student,
                  BenchmarkResult *result) {
    size_t count;
    float *input;
    float *oracle;
    float *actual;
    clock_t start;
    clock_t finish;
    int status;
    volatile uint64_t anti_elision_sink;

    if (config == NULL || result == NULL || config->width == 0 || config->height == 0) {
        return -1;
    }
    if (config->width > SIZE_MAX / config->height) {
        return -1;
    }
    count = config->width * config->height;
    input = (float *)malloc(count * sizeof(*input));
    oracle = (float *)malloc(count * sizeof(*oracle));
    actual = (float *)calloc(count, sizeof(*actual));
    if (input == NULL || oracle == NULL || actual == NULL) {
        free(input);
        free(oracle);
        free(actual);
        return -1;
    }
    if (fill_input(input, count, config->seed) != 0
        || baseline_stencil(input, oracle, config->width, config->height, config->steps) != 0) {
        free(input);
        free(oracle);
        free(actual);
        return -1;
    }

    start = clock();
    if (use_student) {
        status = student_stencil(input, actual, config->width, config->height, config->steps);
    } else {
        status = baseline_stencil(input, actual, config->width, config->height, config->steps);
    }
    finish = clock();

    result->seconds = (double)(finish - start) / (double)CLOCKS_PER_SEC;
    result->digest = digest_grid(actual, count);
    result->oracle_digest = digest_grid(oracle, count);
    result->max_abs_error = compare_grids(actual, oracle, count);
    result->work_units = config->width * config->height * config->steps;
    result->candidate_status = status;
    result->correct = status == 0 && result->max_abs_error <= 0.00001
                       && result->digest == result->oracle_digest;
    anti_elision_sink = result->digest ^ result->oracle_digest ^ (uint64_t)result->work_units;
    (void)anti_elision_sink;

    free(input);
    free(oracle);
    free(actual);
    return result->correct ? 0 : 1;
}

static void print_result(const char *mode, const BenchmarkResult *result) {
    printf("mode=%s seconds=%.9f digest=%llu oracle_digest=%llu "
           "max_abs_error=%.9g work_units=%zu candidate_status=%d correct=%d\n",
           mode,
           result->seconds,
           (unsigned long long)result->digest,
           (unsigned long long)result->oracle_digest,
           result->max_abs_error,
           result->work_units,
           result->candidate_status,
           result->correct);
}

int main(int argc, char **argv) {
    WorkloadConfig config = {64, 64, 10, UINT32_C(7)};
    BenchmarkResult result;
    int use_student = 0;
    int index;

    for (index = 1; index < argc; ++index) {
        if (strcmp(argv[index], "--candidate") == 0) {
            use_student = 1;
        } else if (strcmp(argv[index], "--baseline") == 0) {
            use_student = 0;
        } else {
            fprintf(stderr, "usage: %s [--baseline|--candidate]\n", argv[0]);
            return 64;
        }
    }
    if (run_benchmark(&config, use_student, &result) != 0) {
        print_result(use_student ? "candidate" : "baseline", &result);
        return 1;
    }
    print_result(use_student ? "candidate" : "baseline", &result);
    return 0;
}
