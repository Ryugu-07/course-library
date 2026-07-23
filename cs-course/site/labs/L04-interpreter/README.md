# L04 Tree-walk 解释器

`interpreter.py` 完成一条最小但完整的语言流水线：词法分析、Pratt 表达式解析、AST
求值、词法作用域、函数、闭包和递归。

```bash
python3 -m unittest -v
python3 interpreter.py examples/factorial.tl
```

语言示例：

```text
let make_adder = fn(x) { return fn(y) { return x + y; }; };
let add10 = make_adder(10);
print(add10(32));
```

扩展任务：加入字符串、数组或静态类型检查，并指出它应插在“解析”和“求值”的哪一层。

