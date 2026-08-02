#ifndef P01_XV6_HOOKS_H
#define P01_XV6_HOOKS_H

#include <stdint.h>

/* These portable declarations are an adapter boundary, not an xv6 solution. */

enum {
  P01_OK = 0,
  P01_ERR_INVALID = -1,
  P01_ERR_NOT_IMPLEMENTED = -2,
};

typedef struct {
  uint64_t virtual_address;
  uint64_t physical_address;
  uint64_t permissions;
  uint64_t page_size;
} p01_page_mapping_t;

typedef struct {
  int syscall_number;
  uint64_t arg0;
  uint64_t arg1;
  uint64_t arg2;
  int pid;
} p01_syscall_request_t;

typedef struct {
  const char *lock_name;
  const char *held_lock_names;
} p01_lock_request_t;

/* TODO(student): connect these contracts to the selected xv6-riscv baseline. */
int p01_map_user_page(const p01_page_mapping_t *request);
int p01_dispatch_syscall(const p01_syscall_request_t *request);
int p01_acquire_ordered_lock(const p01_lock_request_t *request);
int p01_recover_filesystem_transaction(uint64_t transaction_id);
int p01_resolve_mmap_fault(uint64_t virtual_address, uint64_t file_offset,
                           uint64_t access_flags);

#endif /* P01_XV6_HOOKS_H */
