#include <array>
#include <atomic>
#include <cassert>
#include <cstdint>
#include <iostream>
#include <thread>
#include <vector>

class TreiberStack {
    struct Node {
        int value;
        Node *next;
        Node *allocated_next;
    };

    std::atomic<Node *> head_{nullptr};
    std::atomic<Node *> allocated_{nullptr};

public:
    ~TreiberStack() {
        Node *node = allocated_.load(std::memory_order_relaxed);
        while (node) {
            Node *next = node->allocated_next;
            delete node;
            node = next;
        }
    }

    void push(int value) {
        Node *node = new Node{value, nullptr, nullptr};
        node->allocated_next = allocated_.load(std::memory_order_relaxed);
        while (!allocated_.compare_exchange_weak(
            node->allocated_next, node, std::memory_order_release, std::memory_order_relaxed)) {}

        node->next = head_.load(std::memory_order_relaxed);
        while (!head_.compare_exchange_weak(
            node->next, node, std::memory_order_release, std::memory_order_relaxed)) {}
    }

    bool pop(int &value) {
        Node *node = head_.load(std::memory_order_acquire);
        while (node && !head_.compare_exchange_weak(
            node, node->next, std::memory_order_acq_rel, std::memory_order_acquire)) {}
        if (!node) return false;
        value = node->value;
        // Nodes remain allocated until destruction. Immediate delete needs a reclamation scheme.
        return true;
    }
};

class VersionedIndexStack {
    static constexpr std::uint32_t EMPTY = 0xffffffffu;
    std::array<std::uint32_t, 2> next_{EMPTY, EMPTY};
    std::atomic<std::uint64_t> head_;

    static std::uint64_t pack(std::uint32_t index, std::uint32_t version) {
        return (static_cast<std::uint64_t>(version) << 32) | index;
    }

public:
    VersionedIndexStack() : head_(pack(0, 0)) {
        next_[0] = 1;
    }

    static std::uint32_t index(std::uint64_t head) {
        return static_cast<std::uint32_t>(head);
    }

    static std::uint32_t version(std::uint64_t head) {
        return static_cast<std::uint32_t>(head >> 32);
    }

    std::uint64_t observe() const {
        return head_.load(std::memory_order_acquire);
    }

    bool pop(std::uint32_t &result) {
        std::uint64_t old = observe();
        for (;;) {
            std::uint32_t old_index = index(old);
            if (old_index == EMPTY) return false;
            std::uint64_t desired = pack(next_[old_index], version(old) + 1);
            if (head_.compare_exchange_weak(old, desired, std::memory_order_acq_rel)) {
                result = old_index;
                return true;
            }
        }
    }

    void push(std::uint32_t value) {
        std::uint64_t old = observe();
        do {
            next_[value] = index(old);
        } while (!head_.compare_exchange_weak(
            old, pack(value, version(old) + 1), std::memory_order_acq_rel));
    }

    bool stale_compare_exchange(std::uint64_t observed, std::uint32_t desired_index) {
        return head_.compare_exchange_strong(
            observed, pack(desired_index, version(observed) + 1), std::memory_order_acq_rel);
    }
};

static void concurrent_stack_test() {
    TreiberStack stack;
    constexpr int threads = 4;
    constexpr int per_thread = 5000;
    std::vector<std::thread> workers;
    for (int thread = 0; thread < threads; ++thread) {
        workers.emplace_back([&, thread] {
            for (int i = 0; i < per_thread; ++i) stack.push(thread * per_thread + i);
        });
    }
    for (auto &worker : workers) worker.join();

    std::atomic<int> popped{0};
    workers.clear();
    for (int thread = 0; thread < threads; ++thread) {
        workers.emplace_back([&] {
            int value;
            while (stack.pop(value)) popped.fetch_add(1, std::memory_order_relaxed);
        });
    }
    for (auto &worker : workers) worker.join();
    assert(popped.load() == threads * per_thread);
}

static void aba_test() {
    VersionedIndexStack stack;  // A(0) -> B(1)
    std::uint64_t thread_one_observed = stack.observe();
    std::uint32_t value;
    assert(stack.pop(value) && value == 0);  // another thread removes A
    assert(stack.pop(value) && value == 1);  // then B
    stack.push(0);                           // and puts A back: same index, new version
    assert(VersionedIndexStack::index(stack.observe()) == 0);
    assert(!stack.stale_compare_exchange(thread_one_observed, 1));
}

int main() {
    concurrent_stack_test();
    aba_test();
    std::cout << "lock-free stack and ABA acceptance: PASS\n";
}
