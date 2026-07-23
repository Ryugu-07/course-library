#include <cuda_runtime.h>

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <vector>

#define CUDA_CHECK(call) do { \
    cudaError_t error = (call); \
    if (error != cudaSuccess) { \
        std::fprintf(stderr, "%s:%d: %s\n", __FILE__, __LINE__, cudaGetErrorString(error)); \
        std::exit(1); \
    } \
} while (0)

constexpr int MAX_N = 128;

__global__ void attention_tiled(const float *q, const float *k, const float *v,
                                float *output, int n, int d) {
    __shared__ float scores[MAX_N];
    __shared__ float reduction[MAX_N];
    int row = blockIdx.x;
    int tid = threadIdx.x;
    float scale = rsqrtf(static_cast<float>(d));

    float score = -CUDART_INF_F;
    if (tid < n) {
        score = 0.0f;
        for (int dimension = 0; dimension < d; ++dimension)
            score += q[row * d + dimension] * k[tid * d + dimension];
        score *= scale;
    }
    scores[tid] = score;
    reduction[tid] = score;
    __syncthreads();

    for (int stride = blockDim.x / 2; stride > 0; stride >>= 1) {
        if (tid < stride) reduction[tid] = fmaxf(reduction[tid], reduction[tid + stride]);
        __syncthreads();
    }
    float row_max = reduction[0];
    float weight = tid < n ? expf(scores[tid] - row_max) : 0.0f;
    scores[tid] = weight;
    reduction[tid] = weight;
    __syncthreads();

    for (int stride = blockDim.x / 2; stride > 0; stride >>= 1) {
        if (tid < stride) reduction[tid] += reduction[tid + stride];
        __syncthreads();
    }
    float denominator = reduction[0];
    for (int dimension = tid; dimension < d; dimension += blockDim.x) {
        float value = 0.0f;
        for (int key = 0; key < n; ++key)
            value += scores[key] * v[key * d + dimension];
        output[row * d + dimension] = value / denominator;
    }
}

static std::vector<float> cpu_attention(const std::vector<float> &q,
                                        const std::vector<float> &k,
                                        const std::vector<float> &v, int n, int d) {
    std::vector<float> output(n * d);
    std::vector<float> scores(n);
    float scale = 1.0f / std::sqrt(static_cast<float>(d));
    for (int row = 0; row < n; ++row) {
        float maximum = -INFINITY;
        for (int key = 0; key < n; ++key) {
            float score = 0.0f;
            for (int dim = 0; dim < d; ++dim)
                score += q[row * d + dim] * k[key * d + dim];
            scores[key] = score * scale;
            maximum = std::max(maximum, scores[key]);
        }
        float denominator = 0.0f;
        for (float &score : scores) {
            score = std::exp(score - maximum);
            denominator += score;
        }
        for (int dim = 0; dim < d; ++dim)
            for (int key = 0; key < n; ++key)
                output[row * d + dim] += scores[key] * v[key * d + dim] / denominator;
    }
    return output;
}

int main() {
    constexpr int n = 64;
    constexpr int d = 32;
    std::vector<float> q(n * d), k(n * d), v(n * d);
    for (int i = 0; i < n * d; ++i) {
        q[i] = static_cast<float>((i * 17) % 101 - 50) / 50.0f;
        k[i] = static_cast<float>((i * 29) % 103 - 51) / 51.0f;
        v[i] = static_cast<float>((i * 43) % 107 - 53) / 53.0f;
    }
    std::vector<float> expected = cpu_attention(q, k, v, n, d);
    float *device_q, *device_k, *device_v, *device_output;
    size_t bytes = n * d * sizeof(float);
    CUDA_CHECK(cudaMalloc(&device_q, bytes));
    CUDA_CHECK(cudaMalloc(&device_k, bytes));
    CUDA_CHECK(cudaMalloc(&device_v, bytes));
    CUDA_CHECK(cudaMalloc(&device_output, bytes));
    CUDA_CHECK(cudaMemcpy(device_q, q.data(), bytes, cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(device_k, k.data(), bytes, cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(device_v, v.data(), bytes, cudaMemcpyHostToDevice));

    cudaEvent_t start, stop;
    CUDA_CHECK(cudaEventCreate(&start));
    CUDA_CHECK(cudaEventCreate(&stop));
    CUDA_CHECK(cudaEventRecord(start));
    attention_tiled<<<n, MAX_N>>>(device_q, device_k, device_v, device_output, n, d);
    CUDA_CHECK(cudaEventRecord(stop));
    CUDA_CHECK(cudaEventSynchronize(stop));
    float milliseconds;
    CUDA_CHECK(cudaEventElapsedTime(&milliseconds, start, stop));
    CUDA_CHECK(cudaGetLastError());

    std::vector<float> actual(n * d);
    CUDA_CHECK(cudaMemcpy(actual.data(), device_output, bytes, cudaMemcpyDeviceToHost));
    float maximum_error = 0.0f;
    for (int i = 0; i < n * d; ++i)
        maximum_error = std::max(maximum_error, std::fabs(actual[i] - expected[i]));
    bool ok = maximum_error < 2e-4f;
    std::printf("attention kernel: %.4f ms, max error=%g, %s\n",
                milliseconds, maximum_error, ok ? "PASS" : "FAIL");
    cudaEventDestroy(start); cudaEventDestroy(stop);
    cudaFree(device_q); cudaFree(device_k); cudaFree(device_v); cudaFree(device_output);
    return ok ? 0 : 1;
}
