#include "benchmark.h"

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

int fill_input(float *grid, size_t count, uint32_t seed) {
    size_t index;
    uint32_t state = seed;
    if (grid == NULL) {
        return -1;
    }
    for (index = 0; index < count; ++index) {
        state = state * UINT32_C(1664525) + UINT32_C(1013904223);
        grid[index] = (float)(state % UINT32_C(1000)) / 1000.0f;
    }
    return 0;
}

int baseline_stencil(const float *input, float *output,
                     size_t width, size_t height, size_t steps) {
    size_t count;
    size_t step;
    size_t row;
    size_t col;
    float *current;
    float *next;

    if (input == NULL || output == NULL || width == 0 || height == 0) {
        return -1;
    }
    if (width > SIZE_MAX / height) {
        return -1;
    }
    count = width * height;
    current = (float *)malloc(count * sizeof(*current));
    next = (float *)malloc(count * sizeof(*next));
    if (current == NULL || next == NULL) {
        free(current);
        free(next);
        return -1;
    }
    memcpy(current, input, count * sizeof(*current));
    for (step = 0; step < steps; ++step) {
        memcpy(next, current, count * sizeof(*next));
        if (width >= 3 && height >= 3) {
            for (row = 1; row + 1 < height; ++row) {
                for (col = 1; col + 1 < width; ++col) {
                    size_t center = row * width + col;
                    next[center] = (current[center]
                                    + current[center - 1]
                                    + current[center + 1]
                                    + current[center - width]
                                    + current[center + width]) * 0.2f;
                }
            }
        }
        {
            float *swap = current;
            current = next;
            next = swap;
        }
    }
    memcpy(output, current, count * sizeof(*output));
    free(current);
    free(next);
    return 0;
}

uint64_t digest_grid(const float *grid, size_t count) {
    size_t index;
    uint64_t digest = UINT64_C(1469598103934665603);
    if (grid == NULL) {
        return UINT64_C(0);
    }
    for (index = 0; index < count; ++index) {
        uint32_t bits;
        memcpy(&bits, &grid[index], sizeof(bits));
        digest ^= (uint64_t)bits + UINT64_C(0x9e3779b97f4a7c15);
        digest *= UINT64_C(1099511628211);
    }
    return digest;
}
