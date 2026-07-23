import unittest

from raft import Cluster


class RaftTests(unittest.TestCase):
    def test_election_and_replication(self):
        cluster = Cluster()
        cluster.run(25)
        leader = cluster.leader()
        self.assertIsNotNone(leader)
        leader.propose("set x=1")
        cluster.run(15)
        self.assertTrue(all(node.log[-1].command == "set x=1" for node in cluster.nodes))
        self.assertTrue(all(node.commit_index == 0 for node in cluster.nodes))

    def test_majority_elects_after_partition(self):
        cluster = Cluster()
        cluster.run(25)
        old = cluster.leader()
        self.assertIsNotNone(old)
        majority = {node.id for node in cluster.nodes if node.id != old.id}
        cluster.partition({old.id}, majority)
        cluster.run(35)
        new = cluster.leader(majority)
        self.assertIsNotNone(new)
        self.assertGreater(new.term, old.term)
        new.propose("set y=2")
        cluster.run(12)
        self.assertTrue(all(cluster.nodes[index].log[-1].command == "set y=2" for index in majority))
        cluster.heal()
        cluster.run(20)
        self.assertTrue(all(node.log[-1].command == "set y=2" for node in cluster.nodes))


if __name__ == "__main__":
    unittest.main()
