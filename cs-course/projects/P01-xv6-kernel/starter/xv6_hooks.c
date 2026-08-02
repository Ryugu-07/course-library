#include "xv6_hooks.h"

/*
 * Deliberately incomplete adapter.  Returning a named sentinel keeps the
 * scaffold syntactically checkable without pretending to implement page
 * tables, syscalls, locks, filesystem recovery, or mmap.
 */

int p01_map_user_page(const p01_page_mapping_t *request) {
  (void)request;
  /* TODO(student): validate alignment/permissions and install the PTE. */
  return P01_ERR_NOT_IMPLEMENTED;
}

int p01_dispatch_syscall(const p01_syscall_request_t *request) {
  (void)request;
  /* TODO(student): preserve the user ABI and dispatch through xv6 syscall(). */
  return P01_ERR_NOT_IMPLEMENTED;
}

int p01_acquire_ordered_lock(const p01_lock_request_t *request) {
  (void)request;
  /* TODO(student): document and enforce the global lock order. */
  return P01_ERR_NOT_IMPLEMENTED;
}

int p01_recover_filesystem_transaction(uint64_t transaction_id) {
  (void)transaction_id;
  /* TODO(student): distinguish committed, torn, and uncommitted records. */
  return P01_ERR_NOT_IMPLEMENTED;
}

int p01_resolve_mmap_fault(uint64_t virtual_address, uint64_t file_offset,
                           uint64_t access_flags) {
  (void)virtual_address;
  (void)file_offset;
  (void)access_flags;
  /* TODO(student): lazy-load a page and arrange dirty-page write-back. */
  return P01_ERR_NOT_IMPLEMENTED;
}
