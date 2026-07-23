#include "mm.h"

#include <stdint.h>
#include <string.h>

#define HEAP_SIZE (1u << 20)
#define HEAP_OFFSET 8u
#define USABLE_SIZE (HEAP_SIZE - 16u)
#define ALIGNMENT 16u
#define ALLOCATED ((size_t)1)
#define SIZE_MASK (~(size_t)0xf)
#define MIN_BLOCK 48u

typedef struct free_block {
    size_t header;
    struct free_block *prev;
    struct free_block *next;
} free_block;

static union {
    max_align_t align;
    unsigned char bytes[HEAP_SIZE];
} heap_storage;
static free_block *free_head;

static size_t align_up(size_t value) {
    return (value + ALIGNMENT - 1) & ~(ALIGNMENT - 1);
}

static size_t block_size(const void *block) {
    return (*(const size_t *)block) & SIZE_MASK;
}

static int is_allocated(const void *block) {
    return (*(const size_t *)block & ALLOCATED) != 0;
}

static void write_tags(void *block, size_t size, int allocated) {
    size_t value = size | (allocated ? ALLOCATED : 0);
    *(size_t *)block = value;
    *(size_t *)((unsigned char *)block + size - sizeof(size_t)) = value;
}

static void remove_free(free_block *block) {
    if (block->prev) block->prev->next = block->next;
    else free_head = block->next;
    if (block->next) block->next->prev = block->prev;
}

static void insert_free(free_block *block) {
    block->prev = NULL;
    block->next = free_head;
    if (free_head) free_head->prev = block;
    free_head = block;
}

int mm_init(void) {
    memset(heap_storage.bytes, 0, sizeof(heap_storage.bytes));
    free_head = (free_block *)(heap_storage.bytes + HEAP_OFFSET);
    write_tags(free_head, USABLE_SIZE, 0);
    free_head->prev = NULL;
    free_head->next = NULL;
    return 0;
}

void *mm_malloc(size_t size) {
    if (size == 0 || size > USABLE_SIZE - 2 * sizeof(size_t)) return NULL;
    size_t needed = align_up(size + 2 * sizeof(size_t));
    if (needed < MIN_BLOCK) needed = MIN_BLOCK;
    free_block *fit = free_head;
    while (fit && block_size(fit) < needed) fit = fit->next;
    if (!fit) return NULL;
    size_t available = block_size(fit);
    remove_free(fit);
    if (available - needed >= MIN_BLOCK) {
        write_tags(fit, needed, 1);
        free_block *rest = (free_block *)((unsigned char *)fit + needed);
        write_tags(rest, available - needed, 0);
        insert_free(rest);
    } else {
        write_tags(fit, available, 1);
    }
    return (unsigned char *)fit + sizeof(size_t);
}

void mm_free(void *ptr) {
    if (!ptr) return;
    unsigned char *block = (unsigned char *)ptr - sizeof(size_t);
    size_t size = block_size(block);
    write_tags(block, size, 0);

    if (block > heap_storage.bytes + HEAP_OFFSET) {
        size_t previous_tag = *(size_t *)(block - sizeof(size_t));
        if (!(previous_tag & ALLOCATED)) {
            size_t previous_size = previous_tag & SIZE_MASK;
            free_block *previous = (free_block *)(block - previous_size);
            remove_free(previous);
            block = (unsigned char *)previous;
            size += previous_size;
        }
    }
    unsigned char *next_address = block + size;
    if (next_address < heap_storage.bytes + HEAP_OFFSET + USABLE_SIZE && !is_allocated(next_address)) {
        free_block *next = (free_block *)next_address;
        size += block_size(next);
        remove_free(next);
    }
    write_tags(block, size, 0);
    insert_free((free_block *)block);
}

int mm_check(void) {
    unsigned char *cursor = heap_storage.bytes + HEAP_OFFSET;
    size_t free_by_walk = 0;
    while (cursor < heap_storage.bytes + HEAP_OFFSET + USABLE_SIZE) {
        size_t size = block_size(cursor);
        if (size < MIN_BLOCK || size % ALIGNMENT != 0) return 0;
        if (*(size_t *)cursor != *(size_t *)(cursor + size - sizeof(size_t))) return 0;
        if (!is_allocated(cursor)) {
            ++free_by_walk;
            unsigned char *next = cursor + size;
            if (next < heap_storage.bytes + HEAP_OFFSET + USABLE_SIZE && !is_allocated(next)) return 0;
        }
        cursor += size;
    }
    if (cursor != heap_storage.bytes + HEAP_OFFSET + USABLE_SIZE) return 0;

    size_t free_by_list = 0;
    for (free_block *node = free_head; node; node = node->next) {
        if (is_allocated(node)) return 0;
        if (node->next && node->next->prev != node) return 0;
        if (++free_by_list > HEAP_SIZE / MIN_BLOCK) return 0;
    }
    return free_by_walk == free_by_list;
}

size_t mm_heap_used(void) {
    size_t used = 0;
    unsigned char *cursor = heap_storage.bytes + HEAP_OFFSET;
    while (cursor < heap_storage.bytes + HEAP_OFFSET + USABLE_SIZE) {
        size_t size = block_size(cursor);
        if (is_allocated(cursor)) used += size;
        cursor += size;
    }
    return used;
}
