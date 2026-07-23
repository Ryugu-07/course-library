#include <cuda_runtime.h>

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <numeric>
#include <vector>

#define CUDA_CHECK(call) do { \
    cudaError_t error = (call); \
    if (error != cudaSuccess) { \
        std::fprintf(stderr, "%s:%d: %s\n", __FILE__, __LINE__, cudaGetErrorString(error)); \
        std::exit(1); \
    } \
} while (0)

__global__ void reduce_atomic(const float *input, float *output, int n) {
    int index = blockIdx.x * blockDim.x + threadIdx.x;
    if (index < n) atomicAdd(output, input[index]);
}

__global__ void reduce_shared(const float *input, float *partial, int n) {
    extern __shared__ float scratch[];
    int index = blockIdx.x * blockDim.x * 2 + threadIdx.x;
    float value = index < n ? input[index] : 0.0f;
    if (index + blockDim.x < n) value += input[index + blockDim.x];
    scratch[threadIdx.x] = value;
    __syncthreads();
    for (int stride = blockDim.x / 2; stride > 0; stride >>= 1) {
        if (threadIdx.x < stride) scratch[threadIdx.x] += scratch[threadIdx.x + stride];
        __syncthreads();
    }
    if (threadIdx.x == 0) partial[blockIdx.x] = scratch[0];
}

__inline__ __device__ float warp_sum(float value) {
    for (int offset = warpSize / 2; offset > 0; offset >>= 1)
        value += __shfl_down_sync(0xffffffffu, value, offset);
    return value;
}

__global__ void reduce_warp(const float *input, float *partial, int n) {
    __shared__ float warp_totals[32];
    int index = blockIdx.x * blockDim.x * 2 + threadIdx.x;
    float value = index < n ? input[index] : 0.0f;
    if (index + blockDim.x < n) value += input[index + blockDim.x];
    value = warp_sum(value);
    int lane = threadIdx.x & 31;
    int warp = threadIdx.x >> 5;
    if (lane == 0) warp_totals[warp] = value;
    __syncthreads();
    value = threadIdx.x < blockDim.x / 32 ? warp_totals[lane] : 0.0f;
    if (warp == 0) value = warp_sum(value);
    if (threadIdx.x == 0) partial[blockIdx.x] = value;
}

__global__ void exclusive_scan(const float *input, float *output, int n) {
    extern __shared__ float data[];
    int tid = threadIdx.x;
    data[tid] = tid < n ? input[tid] : 0.0f;
    __syncthreads();
    for (int offset = 1; offset < blockDim.x; offset <<= 1) {
        int index = (tid + 1) * offset * 2 - 1;
        if (index < blockDim.x) data[index] += data[index - offset];
        __syncthreads();
    }
    if (tid == 0) data[blockDim.x - 1] = 0.0f;
    for (int offset = blockDim.x >> 1; offset > 0; offset >>= 1) {
        int index = (tid + 1) * offset * 2 - 1;
        if (index < blockDim.x) {
            float left = data[index - offset];
            data[index - offset] = data[index];
            data[index] += left;
        }
        __syncthreads();
    }
    if (tid < n) output[tid] = data[tid];
}

int main() {
    constexpr int n = 1 << 20;
    constexpr int threads = 256;
    int blocks = (n + threads * 2 - 1) / (threads * 2);
    std::vector<float> host(n);
    for (int i = 0; i < n; ++i) host[i] = static_cast<float>((i % 101) - 50) / 101.0f;
    float expected = std::accumulate(host.begin(), host.end(), 0.0f);
    float *input, *atomic_output, *partials;
    CUDA_CHECK(cudaMalloc(&input, n * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&atomic_output, sizeof(float)));
    CUDA_CHECK(cudaMalloc(&partials, blocks * sizeof(float)));
    CUDA_CHECK(cudaMemcpy(input, host.data(), n * sizeof(float), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemset(atomic_output, 0, sizeof(float)));

    cudaEvent_t start, stop;
    CUDA_CHECK(cudaEventCreate(&start));
    CUDA_CHECK(cudaEventCreate(&stop));
    float atomic_ms, shared_ms, warp_ms;
    CUDA_CHECK(cudaEventRecord(start));
    reduce_atomic<<<(n + threads - 1) / threads, threads>>>(input, atomic_output, n);
    CUDA_CHECK(cudaEventRecord(stop));
    CUDA_CHECK(cudaEventSynchronize(stop));
    CUDA_CHECK(cudaEventElapsedTime(&atomic_ms, start, stop));
    CUDA_CHECK(cudaGetLastError());
    float atomic_sum;
    CUDA_CHECK(cudaMemcpy(&atomic_sum, atomic_output, sizeof(float), cudaMemcpyDeviceToHost));

    CUDA_CHECK(cudaEventRecord(start));
    reduce_shared<<<blocks, threads, threads * sizeof(float)>>>(input, partials, n);
    CUDA_CHECK(cudaEventRecord(stop));
    CUDA_CHECK(cudaEventSynchronize(stop));
    CUDA_CHECK(cudaEventElapsedTime(&shared_ms, start, stop));
    CUDA_CHECK(cudaGetLastError());
    std::vector<float> host_partials(blocks);
    CUDA_CHECK(cudaMemcpy(host_partials.data(), partials, blocks * sizeof(float), cudaMemcpyDeviceToHost));
    float shared_sum = std::accumulate(host_partials.begin(), host_partials.end(), 0.0f);

    CUDA_CHECK(cudaEventRecord(start));
    reduce_warp<<<blocks, threads>>>(input, partials, n);
    CUDA_CHECK(cudaEventRecord(stop));
    CUDA_CHECK(cudaEventSynchronize(stop));
    CUDA_CHECK(cudaEventElapsedTime(&warp_ms, start, stop));
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaMemcpy(host_partials.data(), partials, blocks * sizeof(float), cudaMemcpyDeviceToHost));
    float warp_result = std::accumulate(host_partials.begin(), host_partials.end(), 0.0f);

    constexpr int scan_n = 1024;
    float *scan_output;
    CUDA_CHECK(cudaMalloc(&scan_output, scan_n * sizeof(float)));
    exclusive_scan<<<1, scan_n, scan_n * sizeof(float)>>>(input, scan_output, scan_n);
    std::vector<float> scan(scan_n);
    CUDA_CHECK(cudaMemcpy(scan.data(), scan_output, scan_n * sizeof(float), cudaMemcpyDeviceToHost));
    float scan_expected = std::accumulate(host.begin(), host.begin() + scan_n - 1, 0.0f);

    float tolerance = 1e-2f * (1.0f + std::fabs(expected));
    bool ok = std::fabs(atomic_sum - expected) < tolerance
           && std::fabs(shared_sum - expected) < tolerance
           && std::fabs(warp_result - expected) < tolerance
           && std::fabs(scan.back() - scan_expected) < 1e-3f;
    std::printf("kernel,milliseconds,result\natomic,%.4f,%g\nshared,%.4f,%g\nwarp,%.4f,%g\n",
                atomic_ms, atomic_sum, shared_ms, shared_sum, warp_ms, warp_result);
    std::printf("CUDA reduction/scan correctness: %s\n", ok ? "PASS" : "FAIL");
    cudaEventDestroy(start); cudaEventDestroy(stop);
    cudaFree(input); cudaFree(atomic_output); cudaFree(partials); cudaFree(scan_output);
    return ok ? 0 : 1;
}
