#!/usr/bin/env python3
import math
import random
import unittest


def attention(q, k, v):
    dimension = len(q[0])
    scale = 1.0 / math.sqrt(dimension)
    output = []
    for query in q:
        scores = [sum(a * b for a, b in zip(query, key)) * scale for key in k]
        row_max = max(scores)
        weights = [math.exp(score - row_max) for score in scores]
        denominator = sum(weights)
        output.append([
            sum(weight * value[d] for weight, value in zip(weights, v)) / denominator
            for d in range(dimension)
        ])
    return output


class AttentionReferenceTests(unittest.TestCase):
    def test_rows_are_finite_and_convex(self):
        rng = random.Random(9)
        q = [[rng.uniform(-2, 2) for _ in range(8)] for _ in range(6)]
        k = [[rng.uniform(-2, 2) for _ in range(8)] for _ in range(6)]
        v = [[rng.uniform(-1, 1) for _ in range(8)] for _ in range(6)]
        result = attention(q, k, v)
        for row in result:
            self.assertTrue(all(math.isfinite(value) for value in row))
            for dimension, value in enumerate(row):
                column = [item[dimension] for item in v]
                self.assertGreaterEqual(value, min(column) - 1e-12)
                self.assertLessEqual(value, max(column) + 1e-12)

    def test_stable_for_large_scores(self):
        q = [[1000.0, 1000.0], [999.0, 1001.0]]
        result = attention(q, q, [[1.0, 2.0], [3.0, 4.0]])
        self.assertTrue(all(math.isfinite(value) for row in result for value in row))


if __name__ == "__main__":
    unittest.main(verbosity=2)

