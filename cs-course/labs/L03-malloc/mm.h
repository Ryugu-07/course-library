#ifndef L03_MM_H
#define L03_MM_H

#include <stddef.h>

int mm_init(void);
void *mm_malloc(size_t size);
void mm_free(void *ptr);
int mm_check(void);
size_t mm_heap_used(void);

#endif

