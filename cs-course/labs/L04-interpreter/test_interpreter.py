import unittest

from interpreter import Interpreter, Parser


class InterpreterTests(unittest.TestCase):
    def evaluate(self, source):
        return Interpreter().run(source)

    def test_precedence(self):
        self.assertEqual(self.evaluate("1 + 2 * 3;"), 7)

    def test_branch(self):
        self.assertEqual(self.evaluate("if (3 > 2) { 10; } else { 20; };"), 10)

    def test_closure(self):
        source = """
        let make = fn(x) { return fn(y) { return x + y; }; };
        let add10 = make(10);
        add10(32);
        """
        self.assertEqual(self.evaluate(source), 42)

    def test_recursion(self):
        source = """
        let fact = fn(n) {
            if (n <= 1) { return 1; } else { return n * fact(n - 1); };
        };
        fact(6);
        """
        self.assertEqual(self.evaluate(source), 720)

    def test_bad_syntax(self):
        with self.assertRaises(SyntaxError):
            Parser("let x = @;").program()


if __name__ == "__main__":
    unittest.main()

