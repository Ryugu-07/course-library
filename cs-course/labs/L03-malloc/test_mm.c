#include "mm.h"

#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    assert(mm_init() == 0);
    void *a = mm_malloc(1);
    void *b = mm_malloc(100);
    void *c = mm_malloc(4096);
    assert(a && b && c);
    assert((uintptr_t)a % 16 == 0);
    memset(b, 0x5a, 100);
    assert(mm_check());

    mm_free(b);
    mm_free(a);
    assert(mm_check());
    void *merged = mm_malloc(120);
    assert(merged);
    mm_free(c);
    mm_free(merged);
    assert(mm_check());
    assert(mm_heap_used() == 0);

    void *slots[128] = {0};
    unsigned seed = 7;
    for (int step = 0; step < 5000; ++step) {
        seed = seed * 1664525u + 1013904223u;
        size_t index = seed % 128u;
        if (slots[index]) {
            mm_free(slots[index]);
            slots[index] = NULL;
        } else {
            size_t size = 1u + ((seed >> 8) % 2048u);
            slots[index] = mm_malloc(size);
            if (slots[index]) memset(slots[index], (int)index, size);
        }
        assert(mm_check());
    }
    for (size_t i = 0; i < 128; ++i) mm_free(slots[i]);
    assert(mm_check());
    assert(mm_heap_used() == 0);
    puts("allocator acceptance: PASS");
    return 0;
}
