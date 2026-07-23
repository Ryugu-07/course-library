#!/usr/bin/env python3
import math
import random
import unittest


def exclusive_scan(values):
    total = 0.0
    output = []
    for value in values:
        output.append(total)
        total += value
    return output


class ReferenceTests(unittest.TestCase):
    def test_reduction_and_scan(self):
        rng = random.Random(7)
        values = [rng.random() for _ in range(1024)]
        self.assertTrue(math.isclose(sum(values), math.fsum(values), rel_tol=1e-12))
        scan = exclusive_scan(values)
        self.assertEqual(scan[0], 0.0)
        self.assertTrue(math.isclose(scan[-1] + values[-1], sum(values), rel_tol=1e-12))


if __name__ == "__main__":
    unittest.main(verbosity=2)
