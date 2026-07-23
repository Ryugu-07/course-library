import random
import unittest

from bplustree import BPlusTree


class BPlusTreeTests(unittest.TestCase):
    def test_insert_lookup_and_update(self):
        tree = BPlusTree(order=4)
        for key in range(100):
            tree.insert(key, key * 2)
        tree.insert(50, "updated")
        tree.validate()
        self.assertEqual(tree.get(50), "updated")
        with self.assertRaises(KeyError):
            tree.get(101)

    def test_random_range_scan(self):
        keys = list(range(300))
        random.Random(42).shuffle(keys)
        tree = BPlusTree(order=7)
        for key in keys:
            tree.insert(key, str(key))
        tree.validate()
        self.assertEqual(
            list(tree.range(73, 129)),
            [(key, str(key)) for key in range(73, 129)],
        )


if __name__ == "__main__":
    unittest.main()
